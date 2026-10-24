// Written by tools/companion_shapes.py from Carnbeg_v502.html. Do not edit: run the tool again.
// The desk app owns these shapes (Principles, Law 3; DEC-0271 rule 2).
const WFM_CAPTURE_SHAPE={
  format:'waterline-capture', version:1,
  // The kind decides the direction (Records 7.6): proof discharges an obligation, a fault creates work.
  kinds:{
    certificate:{direction:'proof',       label:'Certificate or report'},
    reading:    {direction:'proof',       label:'Reading'},
    photo:      {direction:'proof',       label:'Photo'},
    fault:      {direction:'operational', label:'Fault'},
    // A walk of fixed points (a fire walk): its scans travel inside it, one capture per walk.
    round:      {direction:'proof',       label:'Round'},
    // An update to a job from the phone (job 015, P3; DEC-0307, DEC-0308): a note, a flag, Start or Done.
    job:        {direction:'operational', label:'Job update'},
    // An NFC tag linked to a point by its own serial, read on the phone and never written (DEC-0345).
    tag:        {direction:'setup',       label:'Tag linked'},
    // Messages on the phone (DEC-0288, DEC-0348): a notice from the FM or the Notice Sender, a read of one (opened or
    // confirmed), and the shift handover. Each is a record: who wrote, who read, when. Only its writer changes one, by a
    // msgchange, and the original stays in the record (DEC-0353 rule 5).
    notice:     {direction:'message',     label:'Notice'},
    msgread:    {direction:'message',     label:'Read'},
    handover:   {direction:'message',     label:'Shift handover'},
    // The site's chats (DEC-0354): a plain message, a reply under one, and a chat's new photo.
    msg:        {direction:'message',     label:'Message'},
    reply:      {direction:'message',     label:'Reply'},
    chatphoto:  {direction:'message',     label:'Chat photo'},
    // Your own message edited or deleted (DEC-0353 rule 5, DEC-0354 rule 4): the change is its own record, filed onto the
    // message; the words as sent stay.
    msgchange:  {direction:'message',     label:'Message changed'}
  },
  // A tag's serial as Waterline keeps it: upper case, two hex digits a pair, colons between (DEC-0345).
  // '' when it is not a serial. Read by the desk and the phone alike.
  serialOf:function(s){ var h=String(s||'').toUpperCase().replace(/[^0-9A-F]/g,''); return (h.length>=8&&h.length%2===0)?h.match(/../g).join(':'):''; },
  // Every field of version 1. Required: format, version, id, kind, taken, person.
  fields:['format','version','id','kind','taken','person','account','place','loc','note','outcome','reading','duty','plan','device','files','round','started','walkFor','scans','point','group','record','answers','unscanned','complete','signedOff','job','act','msgKind','flag','assign','secs','entry','check','parts','permit','finish','sig','stopped','serial','notice','remind','ref','pos','handover','msg','chat'],
  required:['format','version','id','kind','taken','person'],
  // Records 7.5: an observational photo proves presence, time and person, and nothing else. Say exactly that.
  photoSays:'This photo proves who was there, where and when, and nothing else.',
  // What a job update does (P3). P5 (DEC-0311, DEC-0314): pause carries its reason in note; assign carries
  // assign:{on:[person ids],off:[person ids]}.
  jobActs:['note','flag','unflag','start','done','pause','restart','assign','edit','delete','parts','permit','stop'],
  // Before You Start (W; DEC-0313 rule 1, DEC-0325): a start or restart carries check:{none, hazards:[{id,label}], note,
  // same, kit:[{reg,id}]}: the hazards ticked, or None of These, never neither. Parts used (DEC-0313 rule 4): a done or a
  // parts update carries parts:{text}, typed in the person's own words (DEC-0339 rule 4); a capture from before 23 Oct 2026
  // carries parts:{none, lines:[{what,qty,unit}]}: the lines, or None, never neither. Done's parts are optional.
  checkSays:'This records what the person considered on the day. It is not the site’s risk assessment.',
  partsMax:20,
  // Permits (W; DEC-0313 rule 3): the ticks that need one, by the permit register's type. Electricity needs one only when a
  // supply is isolated (check.isolate); height only when working from above a stepladder (check.from). A permit applied
  // for (act permit) carries its check and permit:{from,to,fields:{key:words}}, the fields the register's own for its type.
  permitFor:{'hot-work':'Hot Works','confined':'Confined Space','electricity':'Electrical Isolation','height':'Working at Height'},
  heightFrom:[{id:'stepladder',label:'A stepladder',permit:false},{id:'ladder',label:'A ladder',permit:false},{id:'tower',label:'A mobile tower',permit:true},
    {id:'scaffold',label:'A scaffold',permit:true},{id:'mewp',label:'A cherry picker or scissor lift',permit:true},{id:'roof',label:'A roof or an open edge',permit:true}],
  permitFields:{'Working at Height':[{k:'accessEquipment',l:'Access equipment'},{k:'edgeProtection',l:'Edge protection or barriers'},{k:'exclusionZone',l:'Exclusion zone below'}],
    'Hot Works':[{k:'fireWatch',l:'Fire watch, and for how long after'},{k:'alarmIsolated',l:'Fire alarm zone isolated'},{k:'extinguisher',l:'Extinguisher, its type and where'}],
    'Electrical Isolation':[{k:'isolationPoints',l:'Isolation points'},{k:'isolationVerifiedBy',l:'Who proves it dead'},{k:'adjacentLive',l:'Live parts nearby'}],
    'Confined Space':[{k:'rescuePlan',l:'Rescue plan'},{k:'gasO2',l:'Oxygen before entry, %'},{k:'numPersons',l:'People standing by'}]},
  // S5 (DEC-0341 rule 9, DEC-0343 rule 4): the check also carries answers:[{id,q,a,sorted}] (each question as shown, the
  // answer, the way it was sorted) and ras:[{id,read,fp,opened}] (each risk assessment offered, as it read). Stop and Tell
  // the FM is act stop with stopped:{why} and the person's words in note. A done carries finish:{answers:[{id,q,a}],found}
  // and sig:{file,by,at}, the finger signature as one PNG among the files.
  // Before You Start as a Take 5 reminder (S5; DEC-0341, DEC-0342, DEC-0343). The questions come with the product, once
  // (Principles, Law 3): the phone asks them and the desk files and shows them. Each hazard: its picture (an ISO 7010 sign
  // where one means exactly it, else a Lucide name), what must be worn (sign codes, told, never asked) and two to four
  // questions. A question: its words, its hint, the answer that is fine (ok), its line on Good to Go, its basis, and what
  // the other answer does: sort (the person's way to sort it, or Stop and Tell the FM) or hold (Start is not offered;
  // why, and what clears it; a permit hold names the permit register's type). heightFrom's permit:true holds the same way.
  take5:{
    steps:['Stop','Look','Assess','Control','Go'],
    signs:{M003:'Ear protection',M004:'Eye protection',M008:'Safety boots',M009:'Gloves',M014:'Hard hat',M015:'Hi-vis',M016:'Mask',
      M018:'Harness',M026:'Apron',W008:'Fall',W012:'Electricity',W017:'Hot surface'},
    hazards:{
      height:{icon:'arrow-up-from-line',sign:'W008',wear:[],qs:[
        {id:'h-sound',q:'Feet, rungs and locks sound?',hint:'Look it over before you climb.',ok:'yes',says:'Ladder looked over',
          sort:'I’ll Use Another One',basis:'HSA, Using Ladders Safely: a pre-use check at least daily; S.I. 299/2007 reg 114'},
        {id:'h-short',q:'Done in under 30 minutes?',hint:'A ladder is for short jobs, not 30 minutes or more in one place.',ok:'yes',
          says:'Under 30 minutes',sort:'I’ll Take Breaks Off It',sortSays:'Breaks off it, over 30 minutes',
          basis:'HSA, Using Ladders Safely: not 30 minutes or more in one position; S.I. 299/2007 reg 114(1)'},
        {id:'h-firm',q:'Firm, level floor, and no one under you?',hint:'Stand it on solid ground. Keep people out from below.',ok:'yes',
          says:'Firm floor, clear below',sort:'I’ll Clear It First',basis:'S.I. 299/2007 reg 114 (stable, firm surface)'},
        {id:'h-hand',q:'One hand free to hold on, off the top steps?',hint:'Not the top two steps of a stepladder, or the top three rungs of a ladder.',
          ok:'yes',says:'A hand to hold, off the top steps',sort:'I’ll Get a Taller One',
          basis:'S.I. 299/2007 reg 114 (a secure handhold); HSA, Using Ladders Safely'}]},
      electricity:{icon:'zap',sign:'W012',wear:[],qs:[
        {id:'e-iso',q:'Switching off a supply to work on it?',hint:'A circuit or a fixed appliance, at the board.',ok:'no',says:'No supply isolated',
          hold:'Isolating a supply needs a permit to work.',clear:'The FM issues it on the desk.',permit:'Electrical Isolation',
          basis:'S.I. 299/2007 reg 86(1)(b), (c); the site’s permit rule (DEC-0313 rule 3)'},
        {id:'e-live',q:'Any chance of touching live parts?',hint:'Wires, terminals, anything not proved dead.',ok:'no',says:'Nothing live to touch',
          hold:'Working live holds the job.',clear:'Make it dead first, or the FM arranges it.',
          basis:'S.I. 299/2007 reg 86(1)(d)'},
        {id:'e-lead',q:'Leads, plugs and chargers undamaged?',hint:'No cuts, tape, scorch marks or loose plugs.',ok:'yes',says:'Leads and chargers undamaged',
          sort:'I’ll Use Another One',basis:'S.I. 299/2007 reg 81 (checked by the user before use)'},
        {id:'e-train',q:'Is this work within your training?',hint:'Fixed wiring and boards are for a competent electrician.',ok:'yes',
          says:'Within training',hold:'This needs a competent electrician.',clear:'The FM arranges one.',basis:'S.I. 299/2007 reg 88'}]},
      'hot-work':{icon:'flame',wear:['M004','M009'],qs:[
        {id:'w-permit',q:'Hot work needs a permit to work',hint:'Flame, sparks or a heat gun.',ok:'none',says:'Permit',
          hold:'Hot work needs a permit to work.',clear:'The FM issues it on the desk.',permit:'Hot Works',
          basis:'Fire Services Act 1981 s.18(2), (3); the site’s permit rule (DEC-0313 rule 3)'},
        {id:'w-clear',q:'Anything that can burn cleared or covered?',hint:'Paper, fabric, dust, sprays, fuel.',ok:'yes',says:'Burnables cleared',
          sort:'I’ll Clear Them First',basis:'Fire Services Act 1981 s.18(3)'},
        {id:'w-ext',q:'Fire extinguisher within reach?',hint:'The right type, in your hand’s reach.',ok:'yes',says:'Extinguisher to hand',
          sort:'I’ll Get One First',basis:'Fire Services Act 1981 s.18(2)'},
        {id:'w-watch',q:'Someone watching for fire, during and after?',hint:'Not you. They stay on after you stop.',ok:'yes',says:'Fire watch',
          sort:'I’ll Get Someone',basis:'Fire Services Act 1981 s.18(2); insurer and industry practice'}]},
      'hot-water':{icon:'thermometer-sun',sign:'W017',wear:['M009'],qs:[
        {id:'t-off',q:'Supply off and pressure let off?',hint:'Before you open a pipe, valve or tank.',ok:'yes',says:'Off, pressure let off',
          sort:'I’ll Turn It Off First',basis:'Safety, Health and Welfare at Work Act 2005 s.19'},
        {id:'t-cool',q:'Cool enough to touch?',hint:'Pipes, rads and cylinders can scald.',ok:'yes',says:'Cool to touch',
          sort:'I’ll Let It Cool',basis:'Safety, Health and Welfare at Work Act 2005 s.19'},
        {id:'t-dry',q:'Water kept off electrics and the floor?',hint:'Cover sockets. Mop up as you go.',ok:'yes',says:'Water kept off',
          sort:'I’ll Cover and Mop',basis:'Safety, Health and Welfare at Work Act 2005 s.19'}]},
      chemicals:{icon:'flask-conical',wear:['M004','M009','M026'],qs:[
        {id:'c-sds',q:'Read the label or data sheet?',hint:'It says what to wear and what not to mix.',ok:'yes',says:'Label read',
          sort:'I’ll Read It First',basis:'S.I. 619/2001 reg 4 (the supplier’s safety data sheet)'},
        {id:'c-mix',q:'One product at a time, never mixed?',hint:'Mixing cleaners can make a toxic gas.',ok:'yes',says:'Never mixed',
          sort:'I’ll Use One at a Time',basis:'S.I. 619/2001 reg 5; the product’s label'},
        {id:'c-air',q:'Room aired, and people kept out till dry?',hint:'Open a window. Sign the door.',ok:'yes',says:'Aired, people kept out',
          sort:'I’ll Air It and Sign It',basis:'S.I. 619/2001 reg 5; Safety, Health and Welfare at Work Act 2005 s.12'}]},
      confined:{icon:'cylinder',wear:[],qs:[
        {id:'s-permit',q:'Going into a confined space needs a permit',hint:'A tank, pit, duct, void, manhole or crawl space.',ok:'none',says:'Permit',
          hold:'Entry needs a permit to work.',clear:'The FM issues it on the desk.',permit:'Confined Space',
          basis:'S.I. 218/2001 reg 5; the site’s permit rule (DEC-0313 rule 3)'},
        {id:'s-watch',q:'Someone outside who can see you?',hint:'They stay at the entrance the whole time.',ok:'yes',says:'Someone outside',
          hold:'No one goes in without someone outside.',clear:'The FM arranges it with the permit.',basis:'S.I. 218/2001 reg 6'},
        {id:'s-rescue',q:'Rescue plan ready?',hint:'How you would be got out, and with what.',ok:'yes',says:'Rescue plan ready',
          hold:'No one goes in without a rescue plan.',clear:'The FM arranges it with the permit.',basis:'S.I. 218/2001 reg 6(1)'}]},
      alone:{icon:'user',wear:[],qs:[
        {id:'a-told',q:'Someone knows where you are, and till when?',hint:'Reception or the person on duty.',ok:'yes',says:'Someone told',
          sort:'I’ll Tell Someone Now',basis:'Safety, Health and Welfare at Work Act 2005 s.19; HSA guidance on lone working'},
        {id:'a-phone',q:'Phone charged and on you?',hint:'In your pocket, not in the van.',ok:'yes',says:'Phone on you',
          sort:'I’ll Get It First',basis:'HSA guidance on lone working (a way to keep in contact)'}]},
      public:{icon:'users',wear:[],qs:[
        {id:'p-keep',q:'Residents and children kept out?',hint:'Lock the door, cone it off or sign it.',ok:'yes',says:'Residents kept out',
          sort:'I’ll Close It Off',basis:'Safety, Health and Welfare at Work Act 2005 s.12'},
        {id:'p-reach',q:'Tools and chemicals out of reach?',hint:'Even when you step away.',ok:'yes',says:'Tools out of reach',
          sort:'I’ll Take Them With Me',basis:'Safety, Health and Welfare at Work Act 2005 s.12'},
        {id:'p-exit',q:'Escape routes and fire doors still clear?',hint:'Nothing left in a corridor or wedging a door.',ok:'yes',says:'Escape routes clear',
          sort:'I’ll Clear Them',basis:'Fire Services Act 1981 s.18(2)'}]}
    },
    every:[{id:'x-tools',icon:'wrench',q:'Tools in working order?',hint:'Charged, nothing cracked or loose.',ok:'yes',says:'Tools in working order',
      sort:'I’ll Swap Them',basis:'Safety, Health and Welfare at Work Act 2005 s.19; S.I. 299/2007 reg 81'}],
    // What to wear (DEC-0346): common sense from S.I. 299/2007 Schedule 2 as replaced by S.I. 610/2021, Part C. Safety
    // boots on every job; a hard hat from an extension ladder up (John's line, about 2 metres: never asked, told from what
    // the work is done from); a harness on a roof or from a lift. Working from above a stepladder needs the Working at
    // Height permit (heightFrom's permit:true).
    everyWear:['M008'],
    fromWear:{ladder:['M014'],tower:['M014'],scaffold:['M014'],roof:['M014','M018'],mewp:['M014','M018']},
    wearBasis:'S.I. 299/2007 Schedule 2, as replaced by S.I. 610/2021, Part C; DEC-0346',
    // Mark Done (DEC-0341 rule 8): `when` names the hazard that must have been tapped; `ask` is the answer that asks what.
    finish:[{id:'f-back',q:'All tools and materials returned?',ok:'yes'},{id:'f-clear',q:'Work area inspected and clear?',ok:'yes'},
      {id:'f-power',q:'Power back on, covers back on?',ok:'yes',when:'electricity'},
      {id:'f-new',q:'Anything new or not as expected?',ok:'no',ask:'yes',askQ:'What did you find?'}],
    stopWhy:['Not safe','Wrong kit','Need help','Something new'],
    says:'This records what was asked and answered on the day. It does not say the job was safe.'
  },
  // Edit and delete (DEC-0321): `entry` names the message changed by its capture id; an edit carries its new words in note.
  // What a person writes on a job's thread (DEC-0307 rule 2). The desk writes the other kinds as it changes the job.
  msgKinds:['Note','Handover','Investigation','Parts needed','Resident said'],
  // A voice note (P6; DEC-0317 rule 3, DEC-0318 rule 4, DEC-0319 rule 2): one sound file on a job note, of these types,
  // up to soundMaxSecs long, its length in secs. A note sent with no words is filed with noWords, never blank.
  sounds:['audio/mp4','audio/webm'], soundMaxSecs:120, noWords:'Voice note, no words given',
  deskKinds:['Raised','Flagged','Assigned','Started','Paused','Restarted','Done','Safety check','Parts used','Permit','Stopped','Signed off'],
  // A flag's level, in order (DEC-0304): words, never a colour. What each means in time is John's to rule (rule 4).
  flagLevels:[{id:'urgent',label:'Urgent'},{id:'asap',label:'As soon as possible'},{id:'week',label:'This week'},{id:'able',label:'When able'},{id:'planned',label:'When planned'}],
  // Messages (DEC-0348, DEC-0351). A notice carries notice:{to:['all'] or department names, title (its first line), text (the
  // rest), confirm}; a reminder is a notice record carrying remind:<the notice's capture id> and no notice of its own. A read is
  // a msgread with ref (the notice's or the handover's capture id), act (one of msgActs) and pos, the reader's position. A
  // handover carries handover:{to:['managers'], ['all'] or department names, dept (the writer's), parts:{who,what,where,why},
  // adds}, with a photo and a voice note in files as a job note has them. adds is what Waterline added from the site file as the
  // writer saw it: {permits:[{id,type,job,no,title,by,at}], started:[{id,no,title,where}] (today, not finished), doneToday:[same],
  // olderInProgress:n}.
  msgActs:['opened','confirmed'],
  // The handover's four parts, as a mission order (DEC-0351 rule 4), each optional; and what an empty one says.
  handoverParts:[{k:'who',l:'Who',hint:'Who is involved, or who should act'},{k:'what',l:'What',hint:'What happened, or what is left to do'},
    {k:'where',l:'Where',hint:'The room, floor or area'},{k:'why',l:'Why',hint:'Why it matters'}],
  handoverNone:'Nothing else to hand over.',
  // The site's chats (DEC-0354): Managers, Everyone, and one per department, whose id is the department's name. A message
  // carries msg:{chat, text} and its files (photos, or one voice note as a job note has); a reply carries ref (the message
  // it answers) and msg:{chat, text}, with files as a message has; a chat's new photo is a chatphoto carrying chat and one
  // image. A notice and a handover carry their chat inside them (notice.chat, handover.chat), and their to is that chat.
  // Nothing sent is erased (DEC-0353). Its writer may change it with a msgchange: ref (the message, reply, notice or
  // handover), act (one of msgChangeActs), chat, and for an edit msg:{text}, the new words. Only a message's or a reply's
  // words are edited; a notice or a handover is deleted and sent again, since people confirm what it said. A deleted one
  // shows "This message was deleted" in its place on every phone. chatOf reads a record's chat; one sent before chats
  // reads from its to.
  chatIds:{managers:'Managers',all:'Everyone'},
  msgChangeActs:['edit','delete'],
  msgDeleted:'This message was deleted',
  chatOf:function(r){ r=r||{}; var x=r.msg||r.notice||r.handover||{}, c=r.chat||x.chat||(Array.isArray(x.to)&&x.to[0])||''; return String(c).trim(); },
  chatName:function(id){ return WFM_CAPTURE_SHAPE.chatIds[id]||String(id||''); }
};
const WFM_SITE_SHAPE={
  format:'waterline-site', version:1,
  folder:'Phone', file:'site.json',
  // A place recurs at this many faults reported in this many days (Principles, Law 7).
  recurAt:2, recurDays:365,
  // Republished at least this often when nothing has changed, so the phone can tell a quiet site
  // from a file the desk has stopped publishing (DEC-0271 rule 4).
  freshHours:12,
  // Small copies of open jobs' photos for the phone (DEC-0305, DEC-0308 rule 4): base64 JPEG text in
  // Phone/photos/, long edge 480px, kept 7 days after the job is done. The site file names them per job.
  photos:{folder:'photos', edge:480, type:'image/jpeg', ext:'.b64', keepDays:7},
  // Open jobs' voice notes for the phone (P6), as the photos are: the sound as base64 text in Phone/audio/, named per
  // entry in the thread with its type and length.
  audio:{folder:'audio', ext:'.b64', keepDays:7},
  // A job's thread on the phone: its last entries, oldest first (DEC-0307 rule 2).
  threadMax:30,
  // Messages (DEC-0348): the relay keeps an index of notices, reads and handovers beside the Inbox (Messages/index.json),
  // text only, so they reach phones whether the desk is open or not. Phones are shown the last keepDays days; older ones are
  // archived beside it (Messages/archive-YYYY-MM.json). A message is a record and is never deleted (DEC-0353).
  messages:{folder:'Messages', index:'index.json', format:'waterline-messages', keepDays:60}
};
