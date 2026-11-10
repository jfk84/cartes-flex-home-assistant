/* Boutons Flex 1.0 — customizable entity buttons, matched to Clim Flex and Volet Flex. */
(() => {
  'use strict';
  const TYPE='boutons-flex-card';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
  const fmt=(v,d=1)=>finite(v)?new Intl.NumberFormat('fr-FR',{maximumFractionDigits:d}).format(Number(v)):'—';
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const event=(node,type,detail)=>node.dispatchEvent(new CustomEvent(type,{detail,bubbles:true,composed:true}));
  const alive=s=>!!s&&!['unavailable','unknown'].includes(s.state);
  const icon=name=>`<ha-icon icon="${esc(name)}" aria-hidden="true"></ha-icon>`;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((o,k)=>(o[k]=v[k],o),{}):v);
  const normalize=config=>{
    const c={...config};if(c.room_entity===undefined&&c.room_light_entity)c.room_entity=c.room_light_entity;
    delete c.room_light_entity;return c;
  };
  const tap=b=>b.tap_action&&typeof b.tap_action==='object'?b.tap_action:{action:b.action||'auto',service:b.service,data:b.data};
  const defaultAction=id=>{
    const domain=String(id||'').split('.')[0];
    if(['button','input_button'].includes(domain))return 'press';
    if(['script','scene'].includes(domain))return 'turn_on';
    return ['light','switch','input_boolean','fan','automation'].includes(domain)?'toggle':'more-info';
  };
  const defaultShowState=id=>!['button','input_button','script','scene','light','switch','input_boolean','fan','automation'].includes(String(id||'').split('.')[0]);
  const legacyButtons=(c,cover)=>{
    const result=[];
    if(c.show_battery!==false){
      if(c.battery_entity)result.push({entity:c.battery_entity,icon:'mdi:battery-80',show_name:false,show_state:true,unit:'%',decimals:0,style:'plain',tap_action:{action:'more-info'}});
      else if(finite(cover?.attributes?.battery_level??cover?.attributes?.battery))result.push({entity:c.entity,attribute:cover.attributes.battery_level!==undefined?'battery_level':'battery',icon:'mdi:battery-80',show_name:false,show_state:true,unit:'%',decimals:0,style:'plain',tap_action:{action:'more-info'}});
    }
    if(c.secondary_light_entity)result.push({entity:c.secondary_light_entity,name:c.secondary_light_name||'Café',show_name:true,show_state:false,style:'pill',tap_action:{action:'auto'}});
    if(c.show_temperature!==false&&c.temperature_entity)result.push({entity:c.temperature_entity,icon:'mdi:thermometer',show_name:false,show_state:true,style:'plain',tap_action:{action:'more-info'}});
    return result;
  };
  const ACTIONS=[['auto','Automatique selon l’entité'],['more-info','Ouvrir les détails'],['toggle','Basculer'],['press','Appuyer / actionner'],['turn_on','Activer / lancer'],['turn_off','Désactiver'],['perform-action','Action Home Assistant personnalisée'],['none','Aucune action']].map(([value,label])=>({value,label}));
  class BoutonsFlexCard extends HTMLElement {
    constructor(){
      super();this.attachShadow({mode:'open'});this._pending=false;this._error='';
      this.shadowRoot.addEventListener('click',e=>{
        const target=e.target.closest('[data-action]');if(!target||target.disabled||e.target.closest('input,label,a'))return;
        if(target.dataset.action==='card'||target.dataset.action==='cover-icon'){this._entityAction(this._surfaceButton(target.dataset.action));return;}
        if(target.dataset.action==='metric'){this._entityAction({entity:this._config.temperature_entity,tap_action:{action:'more-info'}});return;}
        if(target.dataset.action==='room')this._entityAction(this._roomButton());
        else if(target.dataset.action==='sub')this._entityAction(this._subButtons()[Number(target.dataset.index)]);
        else this._run(target.dataset.action,target.dataset.entity);
      });
      this.shadowRoot.addEventListener('keydown',e=>{if(e.target.matches('ha-card')&&['Enter',' '].includes(e.key)){e.preventDefault();this._entityAction(this._surfaceButton('card'));}});
      this.shadowRoot.addEventListener('change',e=>{if(e.target.matches('input[type="range"]'))this._position(e.target.value);});
      this.shadowRoot.addEventListener('input',e=>{if(e.target.matches('input[type="range"]')){const output=this.shadowRoot.querySelector('output');if(output)output.textContent=e.target.value+' %';}});
    }
    setConfig(config){
      if(!config||typeof config.entity!=='string'||!config.entity.includes('.'))throw Error('Choisis une entité principale.');
      this._config=normalize(config);this._render();
    }
    set hass(hass){this._hass=hass;this._render();}
    connectedCallback(){
      this._fitHeight();
      if(typeof ResizeObserver!=='undefined'){
        this._sizeObserver?.disconnect();this._sizeObserver=new ResizeObserver(entries=>{
          const width=entries[0]?.contentRect.width;if(width!==this._lastWidth){this._lastWidth=width;this._fitHeight();}
        });this._sizeObserver.observe(this);
      }
    }
    disconnectedCallback(){this._sizeObserver?.disconnect();this._contentObserver?.disconnect();if(this._heightFrame)cancelAnimationFrame(this._heightFrame);this._heightFrame=0;}
    _scheduleHeight(){
      if(typeof requestAnimationFrame!=='function')return;
      if(this._heightFrame)cancelAnimationFrame(this._heightFrame);
      this._heightFrame=requestAnimationFrame(()=>{this._heightFrame=0;if(this.isConnected)this._fitHeight();});
    }
    _watchHeight(){
      this._contentObserver?.disconnect();
      const content=this.shadowRoot.querySelector('.card-content');
      if(content&&typeof ResizeObserver!=='undefined'){
        this._contentObserver=new ResizeObserver(()=>this._scheduleHeight());this._contentObserver.observe(content);
      }
      this._scheduleHeight();
    }
    _heightValue(){return finite(this._config?.height)&&Number(this._config.height)>0?clamp(Number(this._config.height),32,1000):null;}
    _fitHeight(){
      const card=this.shadowRoot?.querySelector?.('ha-card'),content=this.shadowRoot?.querySelector?.('.card-content');if(!card||!content)return;
      const height=this._heightValue();
      content.style.zoom='1';content.style.width='auto';card.style.height='auto';
      if(!height)return;
      card.style.minHeight='0px';
      // CSS zoom already adjusts the available width. Let flex stretch fill it once.
      let scale=1;
      for(let i=0;i<5;i++){
        const natural=Number.isFinite(content.offsetHeight)?content.offsetHeight*scale:content.getBoundingClientRect().height;if(!natural||natural<=height+.25)break;
        scale*=height/natural;content.style.zoom=String(scale);content.style.width='auto';
      }
      card.style.height=height+'px';
    }
    getCardSize(){const h=this._heightValue();return h?Math.ceil(h/50):Math.ceil((78+62*Math.ceil(this._subButtons().length/(Number(this._config?.columns)||2)))/50);}
    getGridOptions(){return {columns:12,rows:'auto',min_columns:6,min_rows:1};}
    static getConfigElement(){return document.createElement(TYPE+'-editor');}
    static getStubConfig(hass){return {entity:Object.keys(hass?.states||{}).find(k=>/^(switch|light|button)\./.test(k))||'switch.exemple',name:'Ma pièce',sub_buttons:[]};}
    _state(id){return this._hass?.states?.[id];}
    _roomButton(){
      const c=this._config;
      return {entity:c.room_entity,name:c.room_name||'Séjour',icon:c.room_icon,show_name:c.room_show_name!==false,show_state:c.room_show_state===true,show_icon:c.room_show_icon!==false,show_unit:c.room_show_unit!==false,attribute:c.room_attribute,unit:c.room_unit,decimals:c.room_decimals,state_color:c.room_state_color!==false,color:c.room_color,tap_action:c.room_tap_action||{action:'auto'}};
    }
    _subButtons(){return Array.isArray(this._config.sub_buttons)?this._config.sub_buttons.filter(b=>b&&typeof b==='object'):[];}
    _surfaceButton(surface){const c=this._config,icon=surface==='cover-icon';return {entity:(icon?c.icon_tap_entity:c.tap_entity)||c.entity,tap_action:(icon?c.icon_tap_action||c.tap_action:c.tap_action)||{action:'auto'}};}
    _buttonAction(b){const def=tap(b);const action=def.action==='auto'||!def.action?defaultAction(b.entity):def.action;return {def,action};}
    _buttonEnabled(b){
      if(!b)return false;const {def,action}=this._buttonAction(b),s=this._state(b.entity);
      if(action==='none')return false;
      if(['perform-action','call-service','call_service'].includes(action))return !!this._hass&&!this._pending&&/^[a-z_]+\.[a-z_0-9]+$/.test(def.perform_action||def.service||'');
      if(['more-info','details','more_info'].includes(action))return !!s;
      return !this._pending&&!!s&&s.state!=='unavailable';
    }
    _defaultIcon(b,s){
      if(b.icon)return b.icon;if(s?.attributes?.icon)return s.attributes.icon;
      const device=s?.attributes?.device_class;
      if(device==='temperature')return 'mdi:thermometer';if(device==='battery')return 'mdi:battery-80';if(device==='humidity')return 'mdi:water-percent';
      return {light:s?.state==='on'?'mdi:lightbulb-on':'mdi:lightbulb',button:'mdi:gesture-tap-button',input_button:'mdi:gesture-tap-button',switch:'mdi:power',input_boolean:'mdi:toggle-switch',script:'mdi:script-text',scene:'mdi:palette',automation:'mdi:robot',sensor:'mdi:gauge',binary_sensor:'mdi:checkbox-marked-circle-outline',climate:'mdi:thermostat',cover:'mdi:window-shutter',number:'mdi:counter',input_number:'mdi:counter',select:'mdi:format-list-bulleted',input_select:'mdi:format-list-bulleted',fan:'mdi:fan',media_player:'mdi:play-circle',person:'mdi:account'}[String(b.entity||'').split('.')[0]]||'mdi:dots-horizontal';
    }
    _buttonState(b,s){
      if(!s)return 'Entité introuvable';if(s.state==='unavailable')return 'Indisponible';
      const raw=b.attribute?s.attributes?.[b.attribute]:s.state;
      if(raw===null||raw===undefined)return '—';
      if(typeof raw==='boolean')return raw?'Oui':'Non';
      if(finite(raw))return fmt(raw,Math.round(clamp(finite(b.decimals)?Number(b.decimals):1,0,4)));
      if(typeof raw==='object')return JSON.stringify(raw);
      return {on:'Activé',off:'Désactivé',open:'Ouvert',closed:'Fermé',home:'Présent',not_home:'Absent',playing:'Lecture',paused:'Pause',unknown:'Inconnu'}[String(raw)]||String(raw);
    }
    _entityButton(b,primary=false,index=0){
      const s=this._state(b.entity),domain=String(b.entity||'').split('.')[0],name=b.name||s?.attributes?.friendly_name||'Commande';
      const value=this._buttonState(b,s),unit=b.unit!==undefined?b.unit:(!b.attribute?s?.attributes?.unit_of_measurement||'':'');
      const showName=b.show_name===true,showState=b.show_state!==undefined?b.show_state:defaultShowState(b.entity);
      const active=b.state_color!==false&&['on','open','playing','home','heat','cool'].includes(s?.state);
      const label=name+(showState?' : '+value+(b.show_unit!==false&&unit?' '+unit:''):'');
      return `<button class="${primary?'light primary':'sub-button '+(b.style==='plain'?'plain':'pill')} ${active?'is-on':''}" data-action="${primary?'room':'sub'}" data-index="${index}" data-entity="${esc(b.entity||'')}" aria-label="${esc(label)}" title="${esc(label)}" ${this._buttonEnabled(b)?'':'disabled'}>
        ${b.show_icon!==false?`<span class="${primary?'bulb':'sub-icon'}">${icon(this._defaultIcon(b,s))}</span>`:''}
        ${showName?`<span class="${primary?'light-name':'sub-name'}">${esc(name)}</span>`:''}
        ${showState?`<span class="sub-state">${esc(value)}${b.show_unit!==false&&unit?`<small>${esc(unit)}</small>`:''}</span>`:''}
      </button>`;
    }
    _entityAction(b){
      if(!b||!this._buttonEnabled(b))return;
      const {def,action}=this._buttonAction(b),id=b.entity,domain=String(id||'').split('.')[0];
      if(['more-info','details','more_info'].includes(action)){event(this,'hass-more-info',{entityId:id});return;}
      if(action==='toggle')return this._service(domain==='cover'?'cover':'homeassistant','toggle',{entity_id:id});
      if(['press','turn_on','turn_off'].includes(action))return this._service(domain,domain==='cover'&&action!=='press'?(action==='turn_on'?'open_cover':'close_cover'):action,{entity_id:id});
      if(['perform-action','call-service','call_service'].includes(action)){
        const [serviceDomain,service]=(def.perform_action||def.service).split('.');
        const data=def.data&&typeof def.data==='object'&&!Array.isArray(def.data)?{...def.data}:{};
        const target=def.target&&typeof def.target==='object'&&!Array.isArray(def.target)&&Object.keys(def.target).length?{...def.target}:undefined;
        if(!target&&!data.entity_id&&id)data.entity_id=id;
        return this._service(serviceDomain,service,data,target);
      }
    }
    _positionValue(){const value=this._state(this._config.entity)?.attributes?.current_position;return finite(value)?clamp(Number(value),0,100):null;}
    _battery(){
      const c=this._config,s=this._state(c.entity),sensor=c.battery_entity?this._state(c.battery_entity):null;
      const value=c.battery_entity?(alive(sensor)?sensor.state:null):(s?.attributes?.battery_level??s?.attributes?.battery);
      return finite(value)?clamp(Number(value),0,100):null;
    }
    _coverLabel(){
      const s=this._state(this._config.entity);if(!s)return 'Entité introuvable';if(!alive(s))return 'Indisponible';
      const labels={open:'Ouvert',closed:'Fermé',opening:'Ouverture…',closing:'Fermeture…'};
      const value=this._positionValue();return (labels[s.state]||s.state)+(value===null?'':' · '+fmt(value,0)+' %');
    }
    _canCover(action){
      const s=this._state(this._config.entity);if(!alive(s)||this._pending)return false;
      const bit={open:1,close:2,position:4,stop:8}[action];
      const features=s.attributes?.supported_features;
      if(typeof features!=='number'||!bit||!(features&bit))return false;
      if(action==='open'&&s.state==='open'&&this._positionValue()===100)return false;
      if(action==='close'&&s.state==='closed')return false;
      return true;
    }
    async _service(domain,action,data,target){
      this._pending=true;this._error='';this._render();
      try{await this._hass.callService(domain,action,data,target);}
      catch(error){this._error=error?.message||'La commande a échoué.';}
      finally{this._pending=false;this._render();}
    }
    _run(action,id){
      if(action==='details'){
        if(id&&this._state(id))event(this,'hass-more-info',{entityId:id});return;
      }
      if(this._pending)return;
      if(action==='light'){
        return this._entityAction({entity:id});
      }
      if(['open','stop','close'].includes(action)&&this._canCover(action))return this._service('cover',action+'_cover',{entity_id:this._config.entity});
    }
    _position(value){
      if(!this._canCover('position')||!finite(value))return;
      return this._service('cover','set_cover_position',{entity_id:this._config.entity,position:Math.round(clamp(Number(value),0,100))});
    }
    _render(){
      if(!this._config)return;
      const c=this._config,s=this._state(c.entity),title=c.name||s?.attributes?.friendly_name||'Ma pièce';
      const active=['on','open','playing','heat','cool'].includes(s?.state),buttons=this._subButtons();
      const metric=this._state(c.temperature_entity),metricButton={entity:c.temperature_entity,decimals:1};
      const focus=this.shadowRoot.activeElement?.dataset;
      this.shadowRoot.innerHTML=`<style>${STYLES}</style><ha-card class="buttons-card ${active?'main-on':''}" data-action="card" tabindex="0" aria-label="${esc(title)}"><div class="card-content">
        <div class="cover-header">
          <button class="cover-icon" data-action="cover-icon" aria-label="${esc('Icône : '+title)}" ${this._buttonEnabled(this._surfaceButton('cover-icon'))?'':'disabled'}>${icon(this._defaultIcon({entity:c.entity,icon:c.icon},s))}</button>
          <button class="cover-text cover-main" data-action="card" aria-label="${esc(title)}" ${this._buttonEnabled(this._surfaceButton('card'))?'':'disabled'}><span class="name">${esc(title)}</span>${c.show_state!==false?`<span class="state">${esc(this._buttonState({entity:c.entity},s))}</span>`:''}</button>
          ${c.temperature_entity?`<button class="metric" data-action="metric" aria-label="${esc('Détails : '+(metric?.attributes?.friendly_name||c.temperature_entity))}" ${metric?'':'disabled'}>${icon(this._defaultIcon(metricButton,metric))}<span>${esc(this._buttonState(metricButton,metric))}${metric?.attributes?.unit_of_measurement?`<small>${esc(metric.attributes.unit_of_measurement)}</small>`:''}</span></button>`:''}
        </div>
        ${buttons.length?`<div class="button-grid">${buttons.map((button,i)=>this._entityButton(button,false,i)).join('')}</div>`:''}
        <div role="alert" class="error" ${this._error?'':'hidden'}>${esc(this._error)}</div>
      </div></ha-card>`;
      const card=this.shadowRoot.querySelector('ha-card');
      for(const [key,prop] of [['accent_color','--accent'],['warm_color','--warm'],['background_color','--surface'],['header_color','--header'],['text_color','--ink']])if(typeof c[key]==='string'&&CSS.supports('color',c[key]))card.style.setProperty(prop,c[key]);
      for(const [key,prop,min,max] of [['border_radius','--radius',0,50],['title_size','--title-size',10,24]])if(finite(c[key]))card.style.setProperty(prop,clamp(Number(c[key]),min,max)+'px');
      card.style.setProperty('--columns',Math.round(clamp(Number(c.columns)||2,1,6)));
      const width=typeof c.card_width==='number'?c.card_width+'px':c.card_width||'100%';
      this.style.width=CSS.supports('width',width)?width:'100%';this.style.maxWidth='100%';this.style.marginInline='auto';
      const height=this._heightValue();if(height){card.classList.add('fixed-height');card.style.setProperty('--fixed-height',height+'px');}
      buttons.forEach((b,i)=>{if(b.color&&CSS.supports('color',b.color))this.shadowRoot.querySelector('[data-action="sub"][data-index="'+i+'"]').style.setProperty('--sub-color',b.color);});
      this._fitHeight();this._watchHeight();
      if(focus?.action){const match=[...this.shadowRoot.querySelectorAll('[data-action]')].find(n=>n.dataset.action===focus.action&&n.dataset.index===focus.index);match?.focus({preventScroll:true});}
    }

  }
  const STYLES=`
    :host{display:block;container-type:inline-size;--accent:#70d9f7;--warm:#ffad55;--surface:var(--ha-card-background,var(--card-background-color,#1c1c1c));--header:color-mix(in srgb,var(--primary-text-color,#eceff7) 9%,var(--surface));--ink:var(--primary-text-color,#eceff7)}*{box-sizing:border-box}
    ha-card{display:flex;flex-direction:column;justify-content:center;gap:0;min-height:112px;border-radius:var(--radius,18px);padding:0;background:var(--surface);color:var(--ink);font-family:var(--ha-font-family-body,'Segoe UI',Arial,sans-serif);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--ink) 3%,transparent);overflow:hidden}
    ha-card.fixed-height{height:var(--fixed-height)!important;min-height:var(--fixed-height)!important;max-height:var(--fixed-height)!important}
    .card-content{display:flex;flex-direction:column;flex-shrink:0;width:auto;align-self:stretch;min-height:112px;padding:6px 8px 8px}
    button{font:inherit;color:inherit;cursor:pointer;border:0;background:transparent;padding:0;min-width:0;-webkit-tap-highlight-color:transparent}button:disabled{opacity:.4;cursor:default}button:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}button:not(:disabled):hover{filter:brightness(1.13)}ha-icon{display:inline-block;--mdc-icon-size:19px;width:19px;height:19px;flex-shrink:0}
    .cover-header{display:flex;align-items:center;gap:10px;width:100%;text-align:left;min-height:52px;background:linear-gradient(120deg,color-mix(in srgb,var(--accent) 7%,var(--header)),var(--header));border:1px solid color-mix(in srgb,var(--accent) 15%,transparent);border-radius:12px 12px 5px 5px;padding:6px 10px 6px 6px}.cover-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:color-mix(in srgb,var(--surface) 88%,var(--accent));border:1px solid color-mix(in srgb,var(--accent) 25%,transparent);color:var(--accent);flex-shrink:0}.cover-icon ha-icon{--mdc-icon-size:23px;width:23px;height:23px}.cover-text{display:flex;flex-direction:column;gap:4px;min-width:0}.name{font-size:var(--title-size,14px);font-weight:600;letter-spacing:.25px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.state{font-size:11px;letter-spacing:.4px;opacity:.8}.motion-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);margin-left:auto;box-shadow:0 0 10px var(--accent);animation:pulse 1.4s ease-in-out infinite}
    .cover-main{flex:1;align-self:stretch;justify-content:center;text-align:left}.cover-icon{cursor:pointer}
    .position-track{height:3px;background:color-mix(in srgb,var(--ink) 7%,transparent);margin:0 10px;border-radius:0 0 4px 4px;overflow:hidden}.position-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent),#a1eaff 55%,var(--warm));transition:width .6s ease;position:relative}.moving .position-fill:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,#ffffffa0,transparent);transform:translateX(-100%);animation:flow 2s linear infinite}
    .info-row{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px;padding:7px 2px 0}.light{display:flex;align-items:center;gap:8px;text-align:left;font-size:var(--row-size,12px);font-weight:600;min-height:32px}.primary{flex:1;min-width:65px}.bulb{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:color-mix(in srgb,var(--ink) 5%,transparent);color:color-mix(in srgb,var(--ink) 48%,transparent);flex-shrink:0}.light-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.is-on .bulb{color:var(--warm);background:color-mix(in srgb,var(--warm) 9%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--warm) 18%,transparent)}.details{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap}.secondary{padding:0 9px 0 5px;border-radius:10px;gap:4px;background:color-mix(in srgb,var(--ink) 4%,transparent);font-size:11px}.secondary .bulb{width:22px;height:27px;background:none;box-shadow:none}.secondary ha-icon{--mdc-icon-size:15px;width:15px;height:15px}
    .stat{display:flex;align-items:center;gap:4px;font-size:11px;white-space:nowrap;min-height:30px}.stat ha-icon{--mdc-icon-size:15px;width:15px;height:15px;opacity:.8}.stat small{font-size:inherit;margin-left:3px}.battery.low{color:var(--warm)}.temperature{font-variant-numeric:tabular-nums}.controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:8px 3px 1px}.controls button{display:flex;align-items:center;justify-content:center;gap:5px;min-height:34px;border-radius:9px;border:1px solid color-mix(in srgb,var(--accent) 25%,transparent);background:color-mix(in srgb,var(--accent) 4%,transparent);font-size:11px}.controls ha-icon{color:var(--accent)}.slider{display:flex;align-items:center;gap:10px;margin:10px 5px 2px;font-size:11px}.slider input{flex:1;min-width:35px;accent-color:var(--accent)}output{width:40px;text-align:right}.error{font-size:11px;color:var(--error-color,#f08080);padding:8px 5px 2px;overflow-wrap:anywhere}.error[hidden]{display:none}
    .details{min-width:0;max-width:78%}.sub-button{--sub-color:var(--ink);display:flex;align-items:center;justify-content:center;gap:4px;min-height:30px;max-width:155px;min-width:24px;font-size:11px;white-space:nowrap;color:var(--sub-color)}.sub-button.pill{padding:2px 8px;border-radius:10px;background:color-mix(in srgb,var(--ink) 4%,transparent)}.sub-button.plain{padding:0 1px}.sub-icon{display:grid;place-items:center;flex-shrink:0;color:var(--sub-color)}.sub-icon ha-icon{--mdc-icon-size:15px;width:15px;height:15px}.sub-name,.sub-state{overflow:hidden;text-overflow:ellipsis}.sub-name{font-weight:600}.sub-state{font-variant-numeric:tabular-nums}.sub-state small{font:inherit;margin-left:3px}.sub-button.is-on{--sub-color:var(--warm);background:color-mix(in srgb,var(--warm) 7%,transparent)}.sub-button.is-on.plain{background:none}.primary .sub-state{font-size:10px;opacity:.75}.primary .bulb{color:var(--sub-color,color-mix(in srgb,var(--ink) 48%,transparent))}.primary.is-on .bulb{color:var(--sub-color,var(--warm))}
    .buttons-card{border:1px solid color-mix(in srgb,var(--ink) 6%,transparent);box-shadow:inset 0 1px 0 #ffffff05,0 4px 16px #0002}
    .buttons-card .card-content{min-height:0;padding:7px;gap:8px}
    .buttons-card .cover-header{border-radius:14px;min-height:56px;padding:7px;gap:10px;background:linear-gradient(115deg,color-mix(in srgb,var(--accent) 7%,var(--header)),var(--header));border-color:color-mix(in srgb,var(--accent) 16%,transparent)}
    .buttons-card .cover-icon{width:39px;height:39px;color:var(--accent);box-shadow:inset 0 0 12px color-mix(in srgb,var(--accent) 5%,transparent);transition:color .25s,box-shadow .25s}
    .buttons-card.main-on .cover-icon{color:var(--warm);border-color:color-mix(in srgb,var(--warm) 40%,transparent);box-shadow:0 0 16px color-mix(in srgb,var(--warm) 12%,transparent)}
    .buttons-card .state{font-size:10px;letter-spacing:.15px;opacity:.55}.buttons-card .name{letter-spacing:.1px}
    .metric{display:flex;align-items:center;gap:5px;border-radius:13px;padding:9px 10px;background:color-mix(in srgb,var(--surface) 80%,transparent);font-size:12px;white-space:nowrap;border:1px solid #ffffff08}.metric ha-icon{--mdc-icon-size:17px;width:17px;height:17px;color:var(--accent)}.metric small{font:inherit;margin-left:3px}
    .button-grid{display:grid;grid-template-columns:repeat(var(--columns,2),minmax(0,1fr));gap:8px}
    .button-grid .sub-button{position:relative;min-width:0;max-width:none;min-height:54px;border:1px solid color-mix(in srgb,var(--ink) 7%,transparent);border-radius:14px;padding:7px 10px;gap:8px;background:linear-gradient(135deg,color-mix(in srgb,var(--ink) 3%,var(--surface)),var(--surface));transition:border-color .2s,background .2s,box-shadow .2s;flex-wrap:wrap}
    .button-grid .sub-icon{width:34px;height:34px;border-radius:50%;background:color-mix(in srgb,var(--ink) 5%,transparent);border:1px solid color-mix(in srgb,var(--ink) 9%,transparent);color:color-mix(in srgb,var(--ink) 65%,transparent)}.button-grid .sub-icon ha-icon{--mdc-icon-size:21px;width:21px;height:21px}
    .button-grid .sub-button.is-on{border-color:color-mix(in srgb,var(--sub-color) 32%,transparent);background:linear-gradient(120deg,color-mix(in srgb,var(--sub-color) 9%,var(--surface)),var(--surface));box-shadow:inset 0 0 16px color-mix(in srgb,var(--sub-color) 3%,transparent)}
    .button-grid .is-on .sub-icon{color:var(--sub-color);border-color:color-mix(in srgb,var(--sub-color) 35%,transparent);background:color-mix(in srgb,var(--sub-color) 10%,var(--surface));box-shadow:0 0 12px color-mix(in srgb,var(--sub-color) 9%,transparent)}
    .button-grid .sub-button.plain{background:transparent;border-color:transparent;box-shadow:none}
    .button-grid .sub-button:active{transform:scale(.98)}.button-grid .sub-name{font-size:12px}.button-grid .sub-state{font-size:11px;opacity:.75}
    @container(max-width:280px){.metric{padding:7px;font-size:11px}.buttons-card .cover-header{gap:7px}.button-grid{gap:6px}.button-grid .sub-button{padding:6px;gap:5px}}

    @keyframes flow{to{transform:translateX(100%)}}@keyframes pulse{50%{opacity:.3}}.no-motion .motion-dot,.no-motion .position-fill:after{animation:none}.no-motion .position-fill{transition:none}@media(prefers-reduced-motion:reduce){.motion-dot,.position-fill:after{animation:none}.position-fill{transition:none}}
    @container(max-width:390px){.details{gap:6px}.info-row{gap:5px}.light{gap:5px}.primary .bulb{width:25px;height:28px}.stat{font-size:10px}.secondary{padding-right:6px}.name{font-size:var(--title-size,13px)}}
    @container(max-width:300px){.info-row{flex-wrap:wrap}.details{width:100%;max-width:100%;justify-content:space-between}.primary{width:100%}.controls button span{font-size:10px}}
  `;
  const LABELS={entity:'Volet',name:'Nom du volet',icon:'Icône du volet',room_name:'Nom de la pièce',room_light_entity:'Lumière principale (icône à gauche)',secondary_light_entity:'Deuxième lumière (pastille à droite)',secondary_light_name:'Nom de la deuxième lumière',battery_entity:'Capteur de batterie',temperature_entity:'Capteur de température',card_width:'Largeur (100%, 80% ou 500px)',card_height:'Hauteur minimale (ex. 112px)',accent_color:'Couleur principale (bleu Clim)',warm_color:'Couleur chaude (orange Clim)',background_color:'Couleur du fond',header_color:'Couleur de l’en-tête',text_color:'Couleur du texte',border_radius:'Arrondi de la carte',title_size:'Taille du titre',row_size:'Taille du nom de la pièce',show_room:'Afficher la pièce et sa lumière',show_battery:'Afficher la batterie',show_temperature:'Afficher la température',show_position_bar:'Afficher la barre d’ouverture',show_controls:'Afficher les boutons ouvrir / arrêter / fermer',show_position_slider:'Afficher le curseur d’ouverture',animation:'Activer les animations pendant le mouvement'};
  class BoutonsFlexEditor extends HTMLElement{
    constructor(){super();this.attachShadow({mode:'open'});}
    setConfig(config){
      const next=normalize(clone(config));
      // HA echoes each keystroke through setConfig. Keep the existing input nodes.
      if(this._config&&stable(next)===stable(this._config))return;
      this._config=next;this._render();
    }
    set hass(hass){this._hass=hass;this.shadowRoot.querySelectorAll('ha-form').forEach(form=>{form.hass=hass;});}
    _save(config,rebuild=false){
      const next=normalize(config);for(const [key,value]of Object.entries(next))if(value===''||value===null||value===undefined)delete next[key];
      this._config=clone(next);event(this,'config-changed',{config:clone(this._config)});if(rebuild)this._render();
    }
    _buttons(){return Array.isArray(this._config.sub_buttons)?this._config.sub_buttons.filter(b=>b&&typeof b==='object'):[];}
    _form(schema,data,callback){
      const form=document.createElement('ha-form');form.hass=this._hass;form.schema=schema;form.data=data;
      form.computeLabel=field=>BUTTON_LABELS[field.name]||LABELS[field.name]||field.name;
      form.addEventListener('value-changed',e=>{e.stopPropagation();form.data={...e.detail.value};callback(e.detail.value);});return form;
    }
    _buttonData(button){
      const def=tap(button),action=['call-service','call_service'].includes(def.action)?'perform-action':['details','more_info'].includes(def.action)?'more-info':def.action||'auto';
      return {...button,entity:button.entity||'',name:button.name||'',icon:button.icon||'',show_name:button.show_name===true,show_state:button.show_state!==undefined?button.show_state:defaultShowState(button.entity),show_icon:button.show_icon!==false,show_unit:button.show_unit!==false,state_color:button.state_color!==false,attribute:button.attribute||'',unit:button.unit||'',decimals:button.decimals??1,color:button.color||'',style:button.style||'pill',action,service:def.perform_action||def.service||'',data:def.data||{},target:def.target||{}};
    }
    _buttonSchema(data,room=false){
      return [{name:'entity',selector:{entity:{}}},{name:'name',selector:{text:{}}},{name:'icon',selector:{icon:{}}},...['show_icon','show_name','show_state','show_unit','state_color'].map(name=>({name,selector:{boolean:{}}})),{name:'attribute',selector:{text:{}}},{name:'unit',selector:{text:{}}},{name:'decimals',selector:{number:{min:0,max:4,step:1,mode:'box'}}},...(!room?[{name:'style',selector:{select:{options:[{value:'pill',label:'Pastille'},{value:'plain',label:'Sans fond'}],mode:'dropdown'}}}]:[]),{name:'color',selector:{text:{}}},{name:'action',selector:{select:{options:ACTIONS,mode:'dropdown'}}},...(data.action==='perform-action'?[{name:'service',selector:{text:{}}},{name:'data',selector:{object:{}}},{name:'target',selector:{object:{}}}]:[])];
    }
    _makeButton(previous,value){
      const b={...previous,...value},def={action:value.action||'auto'};
      if(def.action==='perform-action'){
        if(value.service)def.perform_action=value.service;
        if(value.data&&Object.keys(value.data).length)def.data=clone(value.data);
        if(value.target&&Object.keys(value.target).length)def.target=clone(value.target);
      }
      b.tap_action=def;for(const key of ['action','service','data','target'])delete b[key];
      for(const [key,v]of Object.entries(b))if(v===''||v===null||v===undefined)delete b[key];return b;
    }
    _render(){
      if(!this._config)return;
      this.shadowRoot.innerHTML='<style>p{font-size:13px;line-height:1.5;color:var(--secondary-text-color)}h3{margin:22px 0 8px}.sub-editor{border:1px solid var(--divider-color,#8885);border-radius:12px;margin:10px 0;padding:10px}summary{cursor:pointer;font-weight:600;padding:4px}.tools{display:flex;gap:8px;margin:10px 0}button{padding:8px 12px;color:var(--primary-text-color);background:var(--secondary-background-color);border:1px solid var(--divider-color,#8885);border-radius:8px;cursor:pointer}button:disabled{opacity:.4}</style><p>Choisis une entité principale et ajoute les boutons de ton choix : interrupteurs, lumières, scripts, capteurs et autres entités.</p><div id="general"></div><h3>Actions de la carte</h3><details id="card-action-editor" class="sub-editor"><summary>Appui sur la carte</summary><div id="card-action"></div></details><details id="icon-action-editor" class="sub-editor"><summary>Appui sur l’icône principale</summary><div id="icon-action"></div></details><h3>Boutons</h3><p>Ajoute, déplace ou supprime les icônes. Pour une entité button, l’action automatique appuie sur le bouton. Pour un capteur, elle ouvre ses détails.</p><div id="subs"></div><div class="tools"><button id="add">＋ Ajouter un sous-bouton</button></div>';
      const schema=[{name:'entity',required:true,selector:{entity:{}}},{name:'name',selector:{text:{}}},{name:'icon',selector:{icon:{}}},{name:'temperature_entity',selector:{entity:{}}},{name:'show_state',selector:{boolean:{}}},{name:'height',selector:{number:{min:0,max:1000,step:1,mode:'box',unit_of_measurement:'px'}}},{name:'columns',selector:{number:{min:1,max:6,step:1,mode:'box'}}},...['card_width','accent_color','warm_color','background_color','header_color','text_color'].map(name=>({name,selector:{text:{}}})),{name:'border_radius',selector:{number:{min:0,max:50,step:1,mode:'box'}}},{name:'title_size',selector:{number:{min:10,max:24,step:1,mode:'box'}}}];
      const oldHeight=this._config.card_height;
      const heightDefault=finite(oldHeight)?Number(oldHeight):typeof oldHeight==='string'&&/^\d+(\.\d+)?px$/.test(oldHeight.trim())?parseFloat(oldHeight):oldHeight?undefined:0;
      const data={card_width:'100%',border_radius:18,title_size:14,columns:2,show_state:true,...this._config,height:this._config.height??heightDefault};
      for(const key of ['show_room','show_position_bar','animation'])data[key]=this._config[key]!==false;
      for(const key of ['show_controls','show_position_slider'])data[key]=this._config[key]===true;
      for(const key of ['card_width','card_height'])if(typeof data[key]==='number')data[key]+='px';
      const generalData=Object.fromEntries(schema.map(field=>[field.name,data[field.name]]));
      const general=this._form(schema,generalData,value=>{
        const next={...this._config};for(const field of schema)if(field.name in value)next[field.name]=value[field.name];this._save(next);
      });
      general.computeLabel=field=>LABELS[field.name]||field.name;this.shadowRoot.querySelector('#general').appendChild(general);
      for(const [slot,actionKey,entityKey] of [['card','tap_action','tap_entity'],['icon','icon_tap_action','icon_tap_entity']]){
        const data=this._buttonData({entity:this._config[entityKey],tap_action:this._config[actionKey]||{action:'auto'}});
        const makeSchema=()=>this._buttonSchema(data).filter(f=>['entity','action','service','data','target'].includes(f.name));
        const form=this._form(makeSchema(),data,value=>{
          const previousCustom=data.action==='perform-action',button=this._makeButton({},value),next={...this._config,[actionKey]:button.tap_action};
          if(value.entity)next[entityKey]=value.entity;else delete next[entityKey];
          Object.assign(data,value);this._save(next);
          if(previousCustom!==(value.action==='perform-action')){form.schema=makeSchema();}
        });
        form.computeLabel=f=>f.name==='entity'?'Entité à commander (vide = entité principale)':BUTTON_LABELS[f.name]||f.name;
        this.shadowRoot.querySelector('#'+slot+'-action').appendChild(form);
      }
      const buttons=this._buttons();
      buttons.forEach((b,i)=>{
        const row=document.createElement('details');row.className='sub-editor';
        const summary=document.createElement('summary');summary.textContent=(i+1)+' — '+(b.name||this._hass?.states?.[b.entity]?.attributes?.friendly_name||b.entity||'Nouveau sous-bouton');row.appendChild(summary);
        const buttonData=this._buttonData(b);
        row.appendChild(this._form(this._buttonSchema(buttonData),buttonData,value=>{
          const list=this._buttons(),updated=this._makeButton(list[i],value);list[i]=updated;
          summary.textContent=(i+1)+' — '+(updated.name||this._hass?.states?.[updated.entity]?.attributes?.friendly_name||updated.entity||'Nouveau sous-bouton');
          this._save({...this._config,sub_buttons:list});
          if((value.action==='perform-action')!==(buttonData.action==='perform-action')){this._render();this.shadowRoot.querySelectorAll('#subs details')[i].open=true;}
        }));
        const tools=document.createElement('div');tools.className='tools';
        for(const [label,delta]of [['↑',-1],['↓',1],['Supprimer',0]]){
          const control=document.createElement('button');control.type='button';control.textContent=label;control.disabled=delta<0&&i===0||delta>0&&i===buttons.length-1;
          control.onclick=()=>{const list=this._buttons();if(delta){[list[i],list[i+delta]]=[list[i+delta],list[i]];}else list.splice(i,1);this._save({...this._config,sub_buttons:list},true);};tools.appendChild(control);
        }
        row.appendChild(tools);this.shadowRoot.querySelector('#subs').appendChild(row);
      });
      this.shadowRoot.querySelector('#add').onclick=()=>{const list=this._buttons();list.push({show_name:false,tap_action:{action:'auto'}});this._save({...this._config,sub_buttons:list},true);const rows=this.shadowRoot.querySelectorAll('#subs details');rows[rows.length-1].open=true;};

    }
  }
  const BUTTON_LABELS={entity:'Entité (tous les types)',name:'Nom du bouton',icon:'Icône',show_name:'Afficher le nom',show_state:'Afficher la valeur / l’état',show_icon:'Afficher l’icône',show_unit:'Afficher l’unité',state_color:'Colorer selon l’état',attribute:'Attribut à afficher (vide = état)',unit:'Unité personnalisée (vide = automatique)',decimals:'Nombre de décimales',style:'Apparence',color:'Couleur personnalisée',action:'Action au clic',service:'Action Home Assistant (ex. button.press)',data:'Données de l’action',target:'Cible de l’action (facultative)'};
  LABELS.show_room='Afficher le bouton principal à gauche';
  Object.assign(LABELS,{entity:'Entité principale (tous les types)',name:'Nom de la carte',icon:'Icône principale',temperature_entity:'Entité affichée dans la pastille en haut à droite',columns:'Nombre de boutons par ligne',show_state:'Afficher l’état sous le titre'});
  LABELS.height='Hauteur générale de la carte (0 = automatique)';
  if(!customElements.get(TYPE))customElements.define(TYPE,BoutonsFlexCard);
  if(!customElements.get(TYPE+'-editor'))customElements.define(TYPE+'-editor',BoutonsFlexEditor);
  window.customCards=window.customCards||[];if(!window.customCards.some(c=>c.type===TYPE))window.customCards.push({type:TYPE,name:'Boutons Flex',description:'Boutons personnalisables, assortis à Clim Flex et Volet Flex.',preview:true});
})();
