// Waterline capture relay (DEC-0279). A Google Apps Script web app in the site's own Google account.
// It adds a capture's files to Inbox/ in the Waterline Workspace,
// never over a file already there (DEC-0265 rule 2), and reads Phone/site.json, which the desk
// publishes (DEC-0271), with the job photos and voice notes the desk copies to Phone/photos/ and Phone/audio/ (DEC-0308 rule 4; P6); and, once set up, registers phones for alerts and sends them (DEC-0288). It keeps an index of notices, reads and handovers in Messages/index.json, so they reach phones whether the desk is open or not (DEC-0348), and of permits applied for from a phone with their answers, in Permits/index.json (DEC-0359). Every request carries the site code; a wrong code writes nothing.
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
      // An issue or a refusal of a permit from someone who cannot issue it is never kept (DEC-0359 rule 2).
      let rec = null;
      if(/\.json$/.test(m[1])){ try{ rec = JSON.parse(Utilities.newBlob(Utilities.base64Decode(String(b.data || ''))).getDataAsString('UTF-8')); }catch(x){} }
      const no = permitGate(rec, ws); if(no) return out(no);
      const lock = LockService.getScriptLock(); lock.waitLock(20000);
      try{
        const inbox = folder(ws, 'Inbox', true);
        if(inbox.getFilesByName(m[1]).hasNext()) return out({ok:false, code:'exists', why:'That file is already in the Inbox.'});
        inbox.createFile(Utilities.newBlob(Utilities.base64Decode(String(b.data || '')), String(b.type || 'application/octet-stream'), m[1]));
      } finally { lock.releaseLock(); }
      // A capture's record arrives last (slice A); a permit applied for alerts whoever can issue it (DEC-0344), and its
      // answer the person who applied (DEC-0359). Only after the file is kept, and a failure here never fails the add.
      if(rec){
        let pi = null; try{ pi = permitKeep(rec, ws); }catch(x){ Logger.log('Permit not kept in the index: ' + (x && x.message || x)); }
        try{ alertFor(rec, ws); }catch(x){ Logger.log('Alert not sent: ' + (x && x.message || x)); }
        try{ if(pi) answerAlert(rec, pi, ws); }catch(x){ Logger.log('Answer alert not sent: ' + (x && x.message || x)); }
        try{ messageFor(rec, ws); }catch(x){ Logger.log('Message not kept in the index: ' + (x && x.message || x)); }
      }
      return out({ok:true});
    }
    if(b.op === 'read'){
      // The site details, and the copies of open jobs' photos and voice notes the desk writes beside them (DEC-0305, DEC-0308 rule 4; P6).
      const p = String(b.path || ''), pm = /^Phone\/(photos|audio)\/([A-Za-z0-9._-]{1,120}\.b64)$/.exec(p);
      if(p === PERMIT_PATH){ const pf = permitFile(ws, false); return pf ? out({ok:true, text:pf.getBlob().getDataAsString('UTF-8')}) : out({ok:false, code:'missing', why:'No permit has been applied for from a phone yet.'}); }
      if(p === MSG_PATH){ const mf = msgFile(ws, false); return mf ? out({ok:true, text:mf.getBlob().getDataAsString('UTF-8')}) : out({ok:false, code:'missing', why:'No message has been sent yet.'}); }
      if(p !== 'Phone/site.json' && !pm) return out({ok:false, code:'bad', why:'Only the site details, messages, permits, job photos and voice notes can be read.'});
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
        // The phone's position and department, and whether its holder is a manager, decide which notices and handovers
        // alert it (DEC-0348 rule 6, DEC-0351). No shift is kept.
        const d = devices(); d[t] = {name:String(b.name || '').slice(0, 80), role:String(b.role || '').slice(0, 40), pid:String(b.pid || '').slice(0, 80),
          pos:String(b.pos || '').slice(0, 80), dept:String(b.dept || '').slice(0, 80), mgr:b.mgr === true, ev:b.ev === true, at:new Date().toISOString()};
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
// One alert to one phone, opening the page at link (the home page when none). A phone that has gone (uninstalled,
// alerts turned off) is dropped.
function pushSend(token, title, body, link){
  const sa = JSON.parse(PROPS.getProperty('SERVICE_ACCOUNT') || '{}');
  const res = UrlFetchApp.fetch('https://fcm.googleapis.com/v1/projects/' + sa.project_id + '/messages:send', {
    method:'post', contentType:'application/json', muteHttpExceptions:true, headers:{Authorization:'Bearer ' + fcmToken()},
    payload:JSON.stringify({message:{token:token, webpush:{notification:{title:title, body:body}, data:{link:link || PAGE}, fcm_options:{link:link || PAGE}}}})});
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
    'The job cannot start until the permit is issued. Open this to issue or refuse it.',
    /^\d\d:\d\d$/.test(String(pm.from || '')) ? 'Work planned from ' + pm.from + '.' : ''].filter(Boolean).join(' ');
  const ts = phonesOf(to);
  if(!ts.length) Logger.log('Permit applied for, no alert: none of ' + to.map(p => p.name).join(', ') + ' has turned alerts on.');
  ts.forEach(t => Logger.log('Permit alert to ' + devices()[t].name + ': ' + JSON.stringify(pushSend(t, title, body, jobLink(rec.job)))));
}
function jobLink(id){ return PAGE + '?job=' + encodeURIComponent(String(id || '')); }
// ── Permits answered on the phone (DEC-0359) ───────────────────────────────────────────────────
// Each permit applied for from a phone is kept in Permits/index.json with its answer, so the applicant's phone can start
// the job as soon as it is issued, with the desk shut (rule 3). The files stay in the Inbox for the desk to file onto
// Permit to Work, which is the record (rule 4). Kept PERMIT_DAYS, as the desk's WFM_SITE_SHAPE.permits.
const PERMIT_PATH = 'Permits/index.json', PERMIT_ACTS = ['permitissue', 'permitrefuse'], PERMIT_DAYS = 30;
function permitFile(ws, create){
  const dir = folder(ws, 'Permits', create); if(!dir) return null;
  const it = dir.getFilesByName('index.json');
  return it.hasNext() ? it.next() : (create ? dir.createFile('index.json', JSON.stringify({format:'waterline-permits', version:1, items:[]}), 'application/json') : null);
}
function permitIndex(f){ try{ const o = JSON.parse(f.getBlob().getDataAsString('UTF-8')); if(o && Array.isArray(o.items)) return o; }catch(e){} return {format:'waterline-permits', version:1, items:[]}; }
// The application an answer is for: by its capture id, or (applied for on the desk) by the register ids it names.
function permitKey(rec){ const ids = ((rec.permit || {}).ids || []).map(String).filter(Boolean).sort(); return String(rec.ref || '') || (ids.length ? 'ptw:' + ids.join('+') : ''); }
function isAnswer(rec){ return !!(rec && rec.kind === 'job' && PERMIT_ACTS.indexOf(rec.act) >= 0); }
// Only the people the desk publishes as able to issue may answer (rule 2), as the desk's wfmPermitIssuers decides.
function permitGate(rec, ws){
  if(!isAnswer(rec)) return null;
  const site = siteFile(ws), to = (site && site.alerts && site.alerts.permit) || [];
  if(!to.some(p => nameKey(p.name) && nameKey(p.name) === nameKey(rec.person)))
    return {ok:false, code:'notissuer', why:(rec.person || 'This phone’s holder') + ' cannot issue or refuse a permit. Only ' + (to.map(p => p.name).join(' or ') || 'the FM and the Permit to Work Issuer') + ' can.'};
  if(!permitKey(rec)) return {ok:false, code:'bad', why:'The answer does not say which permit it is for.'};
  return null;
}
// Keeps an application or an answer. Returns the application an answer was kept against, for its alert; null otherwise,
// and null for a second answer: the first stands, and the second waits in the Inbox for the desk to say so on the job.
function permitKeep(rec, ws){
  const ask = rec && rec.kind === 'job' && rec.act === 'permit' && rec.id;
  if(!ask && !isAnswer(rec)) return null;
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try{
    const f = permitFile(ws, true), ix = permitIndex(f), cut = Date.now() - PERMIT_DAYS * 864e5, pm = rec.permit || {};
    ix.items = ix.items.filter(x => Date.parse((x.answer && x.answer.taken) || x.taken) > cut);
    let it = null;
    if(ask){
      if(ix.items.some(x => x.id === rec.id)) return null;
      const ck = rec.check || {};
      ix.items.push({id:rec.id, job:String(rec.job || ''), types:(pm.types || []).filter(Boolean), person:String(rec.person || ''), pos:String(rec.pos || ''), taken:rec.taken,
        from:String(pm.from || ''), to:String(pm.to || ''), fields:pm.fields || {}, check:{none:ck.none === true, hazards:ck.hazards || [], note:String(ck.note || ''), from:String(ck.from || ''), answers:ck.answers || []}});
    } else {
      const k = permitKey(rec);
      it = ix.items.find(x => x.id === k);
      if(!it){ it = {id:k, job:String(rec.job || ''), types:(pm.types || []).filter(Boolean), ids:(pm.ids || []).map(String), person:'', pos:'', taken:rec.taken}; ix.items.push(it); }
      if(it.answer){ Logger.log('Permit already answered by ' + it.answer.person + '; ' + rec.person + '’s ' + rec.act + ' waits in the Inbox for the desk.'); it = null; }
      else it.answer = {id:rec.id, act:rec.act, person:String(rec.person || ''), pos:String(rec.pos || ''), taken:rec.taken, why:String(pm.why || '').slice(0, 400)};
    }
    ix.updated = new Date().toISOString();
    f.setContent(JSON.stringify(ix));
    return it;
  } finally { lock.releaseLock(); }
}
// The person who applied is told either way, on every phone of theirs but the answerer's.
function answerAlert(rec, it, ws){
  if(!isAnswer(rec) || !(it.person || it.pos)) return;
  const site = siteFile(ws) || {}, j = (site.jobs || []).find(x => x.id === it.job) || {}, d = devices(), ty = it.types || [], a = it.answer;
  const at = Utilities.formatDate(new Date(a.taken || Date.now()), 'Europe/Dublin', 'HH:mm'), ok = a.act === 'permitissue';
  const title = (ty.length === 1 ? ty[0] + ' permit' : 'Permit to work') + (ok ? ' issued' : ' refused');
  const why = String(a.why || '').trim();
  const body = [(j.no ? 'Job ' + j.no : 'Your job') + (j.place ? ', ' + j.place : (j.title ? ', ' + j.title : '')) + '.',
    (ok ? 'Issued by ' : 'Refused by ') + (a.person || 'someone') + ' at ' + at + (!ok && why ? ': ' + why.replace(/[.!?]$/, '') : '') + '.',
    ok ? 'You can start the job.' : 'The job cannot start on this permit.'].join(' ');
  const ts = Object.keys(d).filter(t => d[t].role !== 'test' && sameAs(d[t], it.person, it.pos) && !sameAs(d[t], a.person, a.pos));
  if(!ts.length) Logger.log('Permit answered, no alert: ' + (it.person || 'the applicant') + ' has no phone with alerts on, or answered it themselves.');
  ts.forEach(t => Logger.log('Permit answer alert to ' + d[t].name + ': ' + JSON.stringify(pushSend(t, title, body, jobLink(it.job)))));
}
// ── Messages (DEC-0348) ──────────────────────────────────────────────────────────────────────
// A notice, a read and a handover are kept, text only, in Messages/index.json as they arrive: each record once. Phones are
// shown the last KEEP_DAYS days (WFM_SITE_SHAPE.messages on the desk); older ones move to a monthly archive beside it,
// Messages/archive-YYYY-MM.json, which is only ever added to. A message is a record and is never deleted (DEC-0353). The
// files stay in the Inbox for the desk to file. Messages, replies and chat photos are kept the same way (DEC-0354), and so is a writer's edit or delete of their own (DEC-0353 rule 5): the phones apply it, the original stays. The index also says which positions have a phone set up, so a sender is
// never told a position read what no phone opened (rule 3).
const MSG_PATH = 'Messages/index.json', MSG_KINDS = ['notice', 'msgread', 'handover', 'msg', 'reply', 'chatphoto', 'msgchange'], KEEP_DAYS = 60;
// The chat a record is in (DEC-0354), as the desk's WFM_CAPTURE_SHAPE.chatOf reads it: its own chat, the chat inside its
// message, notice or handover, or (sent before chats) the first place it was sent to. A read has none.
function chatOf(r){ const x = r.msg || r.notice || r.handover || {}; return String(r.chat || x.chat || (Array.isArray(x.to) && x.to[0]) || '').trim(); }
function chatName(id){ return id === 'managers' ? 'Managers' : id === 'all' ? 'Everyone' : String(id || ''); }
function msgFile(ws, create){
  const dir = folder(ws, 'Messages', create); if(!dir) return null;
  const it = dir.getFilesByName('index.json');
  return it.hasNext() ? it.next() : (create ? dir.createFile('index.json', JSON.stringify({format:'waterline-messages', version:1, items:[]}), 'application/json') : null);
}
// Adds messages to the monthly archive of the month each was taken in; one already there is not added twice.
function msgArchive(ws, items){
  const dir = folder(ws, 'Messages', true), by = {};
  items.forEach(x => { const m = String(x.taken || '').slice(0, 7) || 'undated'; (by[m] = by[m] || []).push(x); });
  Object.keys(by).forEach(m => {
    const name = 'archive-' + m + '.json', it = dir.getFilesByName(name), f = it.hasNext() ? it.next() : null;
    const a = f ? msgIndex(f) : {format:'waterline-messages', version:1, archive:m, items:[]};
    const have = new Set(a.items.map(x => x.id));
    a.items = a.items.concat(by[m].filter(x => !have.has(x.id))); a.archive = m;
    if(f) f.setContent(JSON.stringify(a)); else dir.createFile(name, JSON.stringify(a), 'application/json');
  });
}
function msgIndex(f){ try{ const o = JSON.parse(f.getBlob().getDataAsString('UTF-8')); if(o && Array.isArray(o.items)) return o; }catch(e){} return {format:'waterline-messages', version:1, items:[]}; }
function messageFor(rec, ws){
  if(!rec || MSG_KINDS.indexOf(rec.kind) < 0 || !rec.id) return;
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  let ix;
  try{
    const f = msgFile(ws, true); ix = msgIndex(f);
    if(ix.items.some(x => x.id === rec.id)) return;              // the same file twice: kept once, alerted once
    const keep = {}; Object.keys(rec).forEach(k => { if(k !== 'device' && k !== 'account') keep[k] = rec[k]; });
    // Each item carries its chat and, for a reply or a read, the message it is under (DEC-0354): a chat photo's image stays
    // in the Inbox for the desk; the index keeps only its record.
    if(rec.kind !== 'msgread') keep.chat = chatOf(rec);
    keep.ref = String(rec.ref || rec.remind || '');
    const cut = Date.now() - KEEP_DAYS * 864e5, old = ix.items.filter(x => !(Date.parse(x.taken) > cut));
    // Archived before the index is rewritten, so a failure part-way loses nothing (DEC-0353).
    if(old.length) msgArchive(ws, old);
    ix.items = ix.items.filter(x => Date.parse(x.taken) > cut).concat([keep]);
    const d = devices(), ph = {};
    Object.keys(d).forEach(t => { if(d[t].role !== 'test' && d[t].pos) ph[d[t].pos] = {pos:d[t].pos, dept:d[t].dept || ''}; });
    ix.items.forEach(x => { if(x.pos && !ph[x.pos]) ph[x.pos] = {pos:x.pos, dept:''}; });
    ix.phones = Object.keys(ph).map(k => ph[k]); ix.updated = new Date().toISOString();
    f.setContent(JSON.stringify(ix));
  } finally { lock.releaseLock(); }
  messageAlert(rec, ix, ws);
}
// The phones a message reaches: every phone, those whose department is named, or the managers'. Never the sender's own.
function sameAs(dv, person, pos){ return !!((pos && dv.pid === pos) || (nameKey(person) && nameKey(dv.name) === nameKey(person))); }
function audiencePhones(to, sender){
  const d = devices(), all = (to || []).indexOf('all') >= 0;
  return Object.keys(d).filter(t => d[t].role !== 'test' && !sameAs(d[t], sender.person, sender.pos) && (all || (to || []).indexOf(d[t].dept) >= 0 || ((to || []).indexOf('managers') >= 0 && d[t].mgr)));
}
function confirmedBy(ix, id){ return ix.items.filter(x => x.kind === 'msgread' && x.ref === id && x.act === 'confirmed'); }
function messageAlert(rec, ix, ws){
  if(rec.kind === 'msgread') return;                              // a read never alerts
  const d = devices();
  if(rec.kind === 'notice'){
    let n = rec, title;
    if(rec.remind){ n = ix.items.find(x => x.id === rec.remind && x.kind === 'notice' && x.notice); if(!n){ Logger.log('Reminder of a notice the index does not hold: ' + rec.remind); return; } title = 'Reminder: ' + n.notice.title; }
    else{ if(!n.notice || !n.notice.confirm) return;              // a plain notice does not alert (rule 6)
      title = 'Notice: ' + n.notice.title; }
    const done = confirmedBy(ix, n.id);
    const ts = audiencePhones(n.notice.to, n).filter(t => !done.some(r => sameAs(d[t], r.person, r.pos)));
    const body = 'From ' + (n.person || 'the FM') + '. Open Messages to read it and confirm you have read it.';
    if(!ts.length) Logger.log('Notice, no alert: no phone in its audience that has not confirmed has turned alerts on.');
    ts.forEach(t => Logger.log('Notice alert to ' + d[t].name + ': ' + JSON.stringify(pushSend(t, title, body))));
    return;
  }
  if(rec.kind === 'chatphoto') return;                            // a chat's new photo alerts no one (DEC-0354 rule 7)
  if(rec.kind === 'msgchange') return;                            // an edit or a delete alerts no one
  if(rec.kind === 'msg' || rec.kind === 'reply'){ chatAlert(rec, ix, ws); return; }
  // A handover alerts the phones it is sent to when it is sent, as a message in a chat does (DEC-0351 rule 3).
  handoverAlert(rec);
}
// Who a message alerts (DEC-0364 rule 1): the department's phones for a message in its chat, the managers' for one in
// Managers, and in Everyone only the phones that asked for it (`ev`); everyone else counts it unread. A reply alerts the
// writer of the message it answers, and the chat's phones the same way. Never the writer's own phone.
// A group the FM made (DEC-0365) alerts the phones of the positions in it, as the desk published them; it is named by its name.
function chatAlert(rec, ix, ws){
  const d = devices(), chat = chatOf(rec), m = rec.msg || {}, text = String(m.text || '').trim();
  const say = text ? (text.length > 120 ? text.slice(0, 117) + '…' : text) : ((rec.files || []).some(f => /^audio\//.test(f.type || '')) ? 'A voice note.' : 'A photo.');
  const made = ((ws && siteFile(ws)) || {}).chats, grp = Array.isArray(made) ? made.find(c => c && c.made && c.id === chat) : null;
  const inChat = grp ? Object.keys(d).filter(t => d[t].role !== 'test' && !sameAs(d[t], rec.person, rec.pos) && (grp.members || []).indexOf(d[t].pos) >= 0)
    : audiencePhones([chat], rec).filter(t => chat !== 'all' || d[t].ev);
  const cname = grp ? String(grp.name || chat) : chatName(chat);
  let ts, title;
  if(rec.kind === 'reply'){
    const p = ix.items.find(x => x.id === rec.ref) || {};
    const to = (p.person || p.pos) ? Object.keys(d).filter(t => d[t].role !== 'test' && !sameAs(d[t], rec.person, rec.pos) && sameAs(d[t], p.person, p.pos)) : [];
    ts = to.concat(inChat.filter(t => to.indexOf(t) < 0));
    title = (rec.person || 'Someone') + ' replied in ' + cname;
  } else {
    ts = inChat; title = (rec.person || 'Someone') + ' in ' + cname;
  }
  if(!ts.length) Logger.log('Message, no alert: no phone in ' + cname + ' has turned alerts on.');
  ts.forEach(t => Logger.log('Message alert to ' + d[t].name + ': ' + JSON.stringify(pushSend(t, title, say))));
}
function toWords(to){ to = (to || []).map(x => x === 'managers' ? 'Managers' : x === 'all' ? 'everyone' : x); return to.length < 2 ? (to[0] || 'everyone') : to.slice(0, -1).join(', ') + ' and ' + to[to.length - 1]; }
function handoverAlert(rec){
  const h = rec.handover || {}, d = devices(), ts = audiencePhones(h.to, rec), p = h.parts || {};
  const first = ['what', 'who', 'where', 'why'].map(k => String(p[k] || '').trim()).filter(Boolean)[0] || 'Nothing else to hand over.';
  const title = 'Handover from ' + (h.dept || rec.person || 'a colleague');
  const body = (rec.person || 'Someone') + ', to ' + toWords(h.to) + '. ' + (first.length > 120 ? first.slice(0, 117) + '…' : first) + ' Open Messages to read it and confirm.';
  if(!ts.length) Logger.log('Handover, no alert: no phone it was sent to has turned alerts on.');
  ts.forEach(t => Logger.log('Handover alert to ' + d[t].name + ': ' + JSON.stringify(pushSend(t, title, body))));
}
// Run from the editor: one test alert to every registered phone, with the result in the log.
function pushTestAll(){
  const d = devices(), ts = Object.keys(d);
  if(!ts.length) Logger.log('No phone has turned alerts on yet.');
  ts.forEach(t => Logger.log(d[t].name + ' (' + d[t].role + '): ' + JSON.stringify(pushSend(t, 'Waterline test alert', 'Sent from the relay editor.'))));
}
