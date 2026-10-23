// Waterline capture relay (DEC-0279). A Google Apps Script web app in the site's own Google account.
// It adds a capture's files to Inbox/ in the Waterline Workspace,
// never over a file already there (DEC-0265 rule 2), and reads Phone/site.json, which the desk
// publishes (DEC-0271), with the job photos and voice notes the desk copies to Phone/photos/ and Phone/audio/ (DEC-0308 rule 4; P6); and, once set up, registers phones for alerts and sends them (DEC-0288). Every request carries the site code; a wrong code writes nothing.
//
// Set up once:
//   1. script.google.com > New project. Paste this file over Code.gs. Save.
//   2. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Deploy, and allow
//      the access it asks for (its own Drive, to reach the Waterline Workspace folder).
//   3. Choose `setup` in the function list and press Run. The log shows the site code; the set-up
//      link is the page address with the /exec address and that code (see setup).
const PAGE = 'https://john-waterlinefm.github.io/waterline-capture/';
const PROPS = PropertiesService.getScriptProperties();

function setup(){
  let id = PROPS.getProperty('WORKSPACE_ID');
  if(!id){
    const it = DriveApp.getRootFolder().getFoldersByName('Waterline Workspace');
    if(!it.hasNext()) throw new Error('There is no folder called Waterline Workspace at the top of My Drive.');
    id = it.next().getId(); PROPS.setProperty('WORKSPACE_ID', id);
  }
  let code = PROPS.getProperty('SITE_CODE');
  if(!code){ code = Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase(); PROPS.setProperty('SITE_CODE', code); }
  // Run from the editor, getService().getUrl() gives the /dev address, which only the owner can use.
  // The set-up link takes the /exec address shown under Deploy > Manage deployments.
  Logger.log('Workspace folder: ' + DriveApp.getFolderById(id).getName());
  Logger.log('Site code: ' + code);
  Logger.log('Set-up link: ' + PAGE + '?relay=<the /exec address, URL-encoded>&code=' + code);
}

// A new site code: every phone then needs the new set-up link.
function newSiteCode(){ PROPS.deleteProperty('SITE_CODE'); setup(); }

function out(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function folder(parent, name, create){
  const it = parent.getFoldersByName(name);
  if(it.hasNext()) return it.next();
  return create ? parent.createFolder(name) : null;
}

function doPost(e){
  try{
    const b = JSON.parse(e.postData.contents);
    const code = PROPS.getProperty('SITE_CODE');
    if(!code || b.code !== code) return out({ok:false, code:'refused', why:'This phone’s site code is not this site’s. Open the latest set-up link from the desk.'});
    const ws = DriveApp.getFolderById(PROPS.getProperty('WORKSPACE_ID'));
    if(b.op === 'add'){
      const m = /^Inbox\/([A-Za-z0-9._-]{1,120})$/.exec(String(b.path || ''));
      if(!m) return out({ok:false, code:'bad', why:'Only a file in the Inbox folder can be added.'});
      const lock = LockService.getScriptLock(); lock.waitLock(20000);
      try{
        const inbox = folder(ws, 'Inbox', true);
        if(inbox.getFilesByName(m[1]).hasNext()) return out({ok:false, code:'exists', why:'That file is already in the Inbox.'});
        inbox.createFile(Utilities.newBlob(Utilities.base64Decode(String(b.data || '')), String(b.type || 'application/octet-stream'), m[1]));
      } finally { lock.releaseLock(); }
      // A capture's record arrives last (slice A); a permit applied for alerts whoever can issue it (DEC-0344).
      // Only after the file is kept, and a failure here never fails the add.
      if(/\.json$/.test(m[1])) try{ alertFor(JSON.parse(Utilities.newBlob(Utilities.base64Decode(String(b.data || ''))).getDataAsString('UTF-8')), ws); }catch(x){ Logger.log('Alert not sent: ' + (x && x.message || x)); }
      return out({ok:true});
    }
    if(b.op === 'read'){
      // The site details, and the copies of open jobs' photos and voice notes the desk writes beside them (DEC-0305, DEC-0308 rule 4; P6).
      const p = String(b.path || ''), pm = /^Phone\/(photos|audio)\/([A-Za-z0-9._-]{1,120}\.b64)$/.exec(p);
      if(p !== 'Phone/site.json' && !pm) return out({ok:false, code:'bad', why:'Only the site details, job photos and voice notes can be read.'});
      const ph = folder(ws, 'Phone', false), dir = pm ? (ph && folder(ph, pm[1], false)) : ph, it = dir && dir.getFilesByName(pm ? pm[2] : 'site.json');
      if(!it || !it.hasNext()) return out({ok:false, code:'missing', why: pm ? 'That file is not in Phone/' + pm[1] + '.' : 'The desk has not published the site details yet.'});
      return out({ok:true, text:it.next().getBlob().getDataAsString('UTF-8')});
    }
    if(b.op === 'pushConfig'){
      const cfg = PROPS.getProperty('FIREBASE_CONFIG'), vapid = PROPS.getProperty('VAPID_KEY');
      if(!cfg || !vapid) return out({ok:false, code:'missing', why:'Alerts are not set up on the relay yet.'});
      // Taken as pasted from the Firebase console, where the keys are not in quotes.
      let conf; try{ conf = JSON.parse(cfg); }catch(e){ conf = JSON.parse(cfg.replace(/^[^{]*/, '').replace(/;?\s*$/, '').replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":')); }
      return out({ok:true, config:conf, vapidKey:vapid.trim()});
    }
    if(b.op === 'pushRegister'){
      const t = String(b.token || '');
      if(!/^[A-Za-z0-9_:\-]{20,400}$/.test(t)) return out({ok:false, code:'bad', why:'That is not an alert address.'});
      const lock = LockService.getScriptLock(); lock.waitLock(20000);
      try{
        const d = devices(); d[t] = {name:String(b.name || '').slice(0, 80), role:String(b.role || '').slice(0, 40), pid:String(b.pid || '').slice(0, 80), at:new Date().toISOString()};
        PROPS.setProperty('DEVICES', JSON.stringify(d));
      } finally { lock.releaseLock(); }
      return out({ok:true});
    }
    if(b.op === 'pushTest'){
      const t = String(b.token || '');
      if(!devices()[t]) return out({ok:false, code:'bad', why:'This phone is not registered for alerts.'});
      const r = pushSend(t, 'Waterline test alert', 'Sent ' + Utilities.formatDate(new Date(), 'Europe/Dublin', 'HH:mm:ss') + '. If you can read this, alerts work.');
      return out(r);
    }
    return out({ok:false, code:'bad', why:'The relay does not know that request.'});
  }catch(err){ return out({ok:false, code:'error', why:String(err && err.message || err)}); }
}

// ── Alerts (DEC-0288 rule 2; test first) ────────────────────────────────────────────────────
// Sent through Firebase Cloud Messaging's HTTP v1 API with a short-lived token minted from the
// site's own service account. Set up once, in Project Settings > Script properties, by the person
// who owns the Google account (never pasted anywhere else):
//   FIREBASE_CONFIG  the web app's config object, as JSON (public: it identifies the project)
//   VAPID_KEY        the Web Push certificate's public key
//   SERVICE_ACCOUNT  the whole service account key file (secret: it lives only here)
// The phones registered for alerts are kept in the DEVICES property, by alert address.
function devices(){ try{ return JSON.parse(PROPS.getProperty('DEVICES') || '{}'); }catch(e){ return {}; } }
function b64url(x){ return Utilities.base64EncodeWebSafe(x).replace(/=+$/, ''); }
function fcmToken(){
  const cache = CacheService.getScriptCache(), hit = cache.get('FCM_TOKEN');
  if(hit) return hit;
  const sa = JSON.parse(PROPS.getProperty('SERVICE_ACCOUNT') || 'null');
  if(!sa || !sa.private_key || !sa.client_email) throw new Error('The relay has no service account for alerts.');
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({alg:'RS256', typ:'JWT'}));
  const claim = b64url(JSON.stringify({iss:sa.client_email, scope:'https://www.googleapis.com/auth/firebase.messaging',
    aud:'https://oauth2.googleapis.com/token', iat:now, exp:now + 3600}));
  const sig = b64url(Utilities.computeRsaSha256Signature(head + '.' + claim, sa.private_key));
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {method:'post', muteHttpExceptions:true,
    payload:{grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion:head + '.' + claim + '.' + sig}});
  const j = JSON.parse(res.getContentText());
  if(!j.access_token) throw new Error('Google refused the alert sign-in: ' + (j.error_description || j.error || res.getResponseCode()));
  cache.put('FCM_TOKEN', j.access_token, 3000);
  return j.access_token;
}
// One alert to one phone. A phone that has gone (uninstalled, alerts turned off) is dropped.
function pushSend(token, title, body){
  const sa = JSON.parse(PROPS.getProperty('SERVICE_ACCOUNT') || '{}');
  const res = UrlFetchApp.fetch('https://fcm.googleapis.com/v1/projects/' + sa.project_id + '/messages:send', {
    method:'post', contentType:'application/json', muteHttpExceptions:true, headers:{Authorization:'Bearer ' + fcmToken()},
    payload:JSON.stringify({message:{token:token, webpush:{notification:{title:title, body:body}, fcm_options:{link:PAGE}}}})});
  const code = res.getResponseCode();
  if(code === 200) return {ok:true};
  if(code === 404 || /UNREGISTERED/.test(res.getContentText())){
    const d = devices(); delete d[token]; PROPS.setProperty('DEVICES', JSON.stringify(d));
    return {ok:false, code:'gone', why:'That phone no longer takes alerts. Turn alerts on again on the phone.'};
  }
  return {ok:false, code:'error', why:'Google did not send the alert (' + code + '): ' + res.getContentText().slice(0, 300)};
}
// The alerts the relay sends (DEC-0344). Who gets one is decided on the desk and published in the site file
// (alerts.permit: name and Organisation Structure id); this only matches phones to it. The test app's phones
// (role 'test') never get a real alert.
function siteFile(ws){
  const ph = folder(ws, 'Phone', false), it = ph && ph.getFilesByName('site.json');
  return it && it.hasNext() ? JSON.parse(it.next().getBlob().getDataAsString('UTF-8')) : null;
}
function nameKey(n){ return String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function phonesOf(people){
  const d = devices();
  return Object.keys(d).filter(t => d[t].role !== 'test' && people.some(p => (p.id && d[t].pid === p.id) || (nameKey(p.name) && nameKey(d[t].name) === nameKey(p.name))));
}
function alertFor(rec, ws){
  if(!rec || rec.kind !== 'job' || rec.act !== 'permit') return;
  const site = siteFile(ws), to = (site && site.alerts && site.alerts.permit) || [];
  if(!to.length){ Logger.log('Permit applied for, no alert: the site file names no one who can issue it. Reload the desk so it publishes them.'); return; }
  const j = (site.jobs || []).find(x => x.id === rec.job) || {}, pm = rec.permit || {}, ty = (pm.types || []).filter(Boolean);
  const at = Utilities.formatDate(new Date(rec.taken || Date.now()), 'Europe/Dublin', 'HH:mm');
  const title = (ty.length === 1 ? ty[0] + ' permit' : 'Permit to work') + ' applied for';
  const body = [(j.no ? 'Job ' + j.no : 'A job') + (j.place ? ', ' + j.place : (j.title ? ', ' + j.title : '')) + '.',
    (rec.person || 'Someone') + ' applied at ' + at + (ty.length > 1 ? ' for ' + ty.join(' and ') : '') + '.',
    'The job cannot start until the permit is issued on the desk’s Permit to Work page.',
    /^\d\d:\d\d$/.test(String(pm.from || '')) ? 'Work planned from ' + pm.from + '.' : ''].filter(Boolean).join(' ');
  const ts = phonesOf(to);
  if(!ts.length) Logger.log('Permit applied for, no alert: none of ' + to.map(p => p.name).join(', ') + ' has turned alerts on.');
  ts.forEach(t => Logger.log('Permit alert to ' + devices()[t].name + ': ' + JSON.stringify(pushSend(t, title, body))));
}
// Run from the editor: one test alert to every registered phone, with the result in the log.
function pushTestAll(){
  const d = devices(), ts = Object.keys(d);
  if(!ts.length) Logger.log('No phone has turned alerts on yet.');
  ts.forEach(t => Logger.log(d[t].name + ' (' + d[t].role + '): ' + JSON.stringify(pushSend(t, 'Waterline test alert', 'Sent from the relay editor.'))));
}
