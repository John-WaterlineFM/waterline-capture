// Written by tools/companion_shapes.py from Carnbeg_v552.html. Do not edit: run the tool again.
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
    // An outlet's name, type or area changed on the flush round (job 015, slice FY): filed onto the outlet at once,
    // the old values kept in the audit (John, 10 Nov 2026: "it applies to the desk too").
    outletchange:{direction:'setup',      label:'Outlet changed'},
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
    // A chat group the FM makes, edits or closes (DEC-0365): a set of roles, never a department.
    chatgroup:  {direction:'message',     label:'Chat group'},
    // Your own message edited or deleted (DEC-0353 rule 5, DEC-0354 rule 4): the change is its own record, filed onto the
    // message; the words as sent stay.
    msgchange:  {direction:'message',     label:'Message changed'}
  },
  // A tag's serial as Waterline keeps it: upper case, two hex digits a pair, colons between (DEC-0345).
  // '' when it is not a serial. Read by the desk and the phone alike.
  serialOf:function(s){ var h=String(s||'').toUpperCase().replace(/[^0-9A-F]/g,''); return (h.length>=8&&h.length%2===0)?h.match(/../g).join(':'):''; },
  // Every field of version 1. Required: format, version, id, kind, taken, person.
  fields:['format','version','id','kind','taken','person','change','account','place','loc','note','outcome','reading','duty','plan','device','files','round','started','walkFor','scans','point','group','record','answers','unscanned','complete','signedOff','job','act','msgKind','flag','assign','secs','entry','check','parts','permit','finish','sig','stopped','serial','notice','remind','ref','pos','handover','msg','chat','chatGroup','pauses','early','allOk','noScan','flush','signedIn'], // Why a walk was stopped before every point was scanned or named (DEC-0362 rule 2). Other takes a sentence.
  earlyWhy:[{id:'incident',label:'Called to an incident'},{id:'time',label:'Out of time'},{id:'access',label:'Area not accessible'},{id:'other',label:'Something else'}],
  // Why a walk signed off with no point scanned has none (DEC-0372 rule 3): its lines are done but Claimed. Other takes a sentence.
  noScanWhy:[{id:'battery',label:'Phone died'},{id:'nophone',label:'Forgot the phone'},{id:'tags',label:'Tags would not scan'},{id:'other',label:'Something else'}],
  required:['format','version','id','kind','taken','person'],
  // Records 7.5: an observational photo proves presence, time and person, and nothing else. Say exactly that.
  photoSays:'This photo proves who was there, where and when, and nothing else.',
  // What a job update does (P3). P5 (DEC-0311, DEC-0314): pause carries its reason in note; assign carries
  // assign:{on:[person ids],off:[person ids]}.
  jobActs:['note','flag','unflag','start','done','pause','restart','assign','edit','delete','parts','permit','stop','permitissue','permitrefuse'],
  // A permit issued or refused on the phone (DEC-0359): act permitissue or permitrefuse, ref the capture id of the application
  // ('' when it was applied for on the desk), permit:{ids:[register ids, when the desk has filed it], types, why}. Only the
  // people in the site file's alerts.permit may send one; the relay and the desk both refuse anyone else.
  permitActs:['permitissue','permitrefuse'],
  // Before You Start (W; DEC-0313 rule 1, DEC-0325): a start or restart carries check:{none, hazards:[{id,label}], note,
  // same, kit:[{reg,id}]}: the hazards ticked, or None of These, never neither. A check kept from another job (DEC-0411)
  // also carries sameFrom:{job, no, at, different:'no'}: the job it came from, when, and that nothing here was different. Parts used (DEC-0313 rule 4): a done or a
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
  // (Principles, Law 3): the phone asks them and the desk files and shows them. Each hazard (DEC-0383: the one list, read by the desk and the phone): its name, its short name, its picture (an ISO 7010 sign
  // where one means exactly it, else a Lucide name), what must be worn (sign codes, told, never asked) and two to four
  // questions. A question: its words, its hint, the answer that is fine (ok), its line on Good to Go, its basis, and what
  // the other answer does: sort (the person's way to sort it, or Stop and Tell the FM) or hold (Start is not offered;
  // why, and what clears it; a permit hold names the permit register's type). heightFrom's permit:true holds the same way.
  take5:{
    steps:['Stop','Look','Assess','Control','Go'],
    // Each step says what it means, in one line in the zone (DEC-0360 rule 1). Stop and Look are one screen.
    lines:{look:'Stop before you start. Look round: what here could hurt you, or anyone near?',
      from:'What are you working from? It decides what is asked.',
      assess:'Is each one under control? Yes or No.',
      control:'Not yet. Sort it before you start, or stop and tell the FM.',
      go:'Start, and keep looking. If anything changes, stop.'},
    // Something Else, the ninth tile (DEC-0360 rule 4): what the person sees that the list does not. It is kept on the
    // check as `seen` and goes to the FM for the risk assessment review, as Mark Done's "Anything new" does.
    other:{label:'Something else',q:'What is it, and what will you do about it?',hint:'It goes on the job and to the FM, to look at the risk assessment.'},
    signs:{M003:'Ear protection',M004:'Eye protection',M008:'Safety boots',M009:'Gloves',M014:'Hard hat',M015:'Hi-vis',M016:'Mask',
      M018:'Harness',M026:'Apron',W008:'Fall',W012:'Electricity',W017:'Hot surface'},
    hazards:{
      // Each question carries `sure`, the same check as one short sentence that is true when it is fine, for the phone's
      // page of checks (DEC-0411 v4 rule 6; plain words, DEC-0341 rule 2); `ask` is the page's heading. A height question
      // marked `for:['ladder']` is asked only for a leaning ladder (rule 7). `sure` or `ask` may be keyed by what the
      // work is done from, `_` the default.
      height:{label:'Working at height',short:'Height',icon:'arrow-up-from-line',sign:'W008',wear:[],
        ask:{_:'Before you go up',stepladder:'Before you go up the stepladder',ladder:'Before you go up the ladder'},qs:[
        {id:'h-sound',q:'Feet, rungs and locks sound?',hint:'Look it over before you climb.',ok:'yes',says:'Ladder looked over',sure:'The ladder is not damaged.',
          sort:'I’ll Use Another One',basis:'HSA, Using Ladders Safely: a pre-use check at least daily; S.I. 299/2007 reg 114'},
        {id:'h-short',q:'Done in under 30 minutes?',hint:'A ladder is for short jobs, not 30 minutes or more in one place.',ok:'yes',
          says:'Under 30 minutes',sure:'The job takes less than 30 minutes.',sort:'I’ll Take Breaks Off It',sortSays:'Breaks off it, over 30 minutes',
          basis:'HSA, Using Ladders Safely: not 30 minutes or more in one position; S.I. 299/2007 reg 114(1)'},
        {id:'h-firm',q:'Is the floor flat and hard?',hint:'Not on a box, a pallet or anything that moves.',ok:'yes',
          says:'Firm, level floor',sure:'The ladder stands on a flat, hard floor.',sort:'I’ll Move It',basis:'S.I. 299/2007 reg 114 (stable, firm surface)'},
        {id:'h-tied',for:['ladder'],q:'Is the ladder tied, or is someone holding the bottom?',hint:'Tie it at the top if you can. If not, a second person holds the bottom.',ok:'yes',
          says:'Tied, or held at the bottom',sure:'The ladder is tied at the top, or another person holds the bottom.',sort:'I’ll Get Someone to Hold It',sortSays:'A second person holds it',
          basis:'S.I. 299/2007 reg 114(e); HSA, Using Ladders Safely: securing your ladder'},
        {id:'h-angle',for:['ladder'],q:'Is the foot of the ladder about a quarter of its height from the wall?',hint:'A 4-metre ladder stands 1 metre out. That is the 1 in 4 rule, about 75 degrees.',ok:'yes',
          says:'Set at 1 in 4',sure:'The foot of the ladder is about a quarter of its height from the wall. A 4-metre ladder: 1 metre out.',sort:'I’ll Move It',sortSays:'Moved to 1 in 4',
          basis:'HSA, Using Ladders Safely: the correct angle is 75 degrees or the 1 in 4 rule'},
        {id:'h-hand',q:'One hand free to hold on, off the top steps?',hint:'Not the top two steps of a stepladder, or the top three rungs of a ladder.',
          ok:'yes',says:'A hand to hold, off the top steps',sure:{_:'You hold on with one hand. You do not stand on the top two steps.',ladder:'You hold on with one hand. You do not stand on the top three rungs.'},
          sort:'I’ll Get a Taller One',sortSays:'Taller ladder used',basis:'S.I. 299/2007 reg 114 (a secure handhold); HSA, Using Ladders Safely'},
        {id:'h-tools',q:'Are your tools in a belt or tied on?',hint:'Nothing loose that can fall on someone.',ok:'yes',
          says:'Tools in a belt or tied on',sure:'Your tools are in a belt or tied on. Nothing can fall.',sort:'I’ll Use a Tool Belt',sortSays:'Tool belt used',
          basis:'S.I. 299/2007 reg 116(a); HSA, Using Ladders Safely: light work only'},
        {id:'h-zone',q:'Can anyone walk under you?',hint:'Put out cones or a sign if people pass.',ok:'no',
          says:'Nobody can walk under',sure:'Nobody can walk under you. Cones or a sign are out.',sort:'I’ll Cone It Off',sortSays:'Coned off',
          basis:'S.I. 299/2007 reg 117'}]},
      electricity:{label:'Electricity',short:'Electricity',icon:'zap',sign:'W012',wear:[],ask:'Before you work near power',qs:[
        {id:'e-iso',q:'Switching off a supply to work on it?',hint:'A circuit or a fixed appliance, at the board.',ok:'no',sure:'You do not turn off the power to do this job.',says:'No supply isolated',
          hold:'Isolating a supply needs a permit to work.',clear:'The FM or the permit issuer issues it, from their phone or the desk.',permit:'Electrical Isolation',
          basis:'S.I. 299/2007 reg 86(1)(b), (c); the site’s permit rule (DEC-0313 rule 3)'},
        {id:'e-live',q:'Any chance of touching live parts?',hint:'Wires, terminals, anything not proved dead.',ok:'no',sure:'You will not touch anything with power in it.',says:'Nothing live to touch',
          hold:'Working live holds the job.',clear:'Make it dead first, or the FM arranges it.',
          basis:'S.I. 299/2007 reg 86(1)(d)'},
        {id:'e-lead',q:'Leads, plugs and chargers undamaged?',hint:'No cuts, tape, scorch marks or loose plugs.',ok:'yes',sure:'Cables, plugs and chargers are not damaged.',says:'Leads and chargers undamaged',
          sort:'I’ll Use Another One',basis:'S.I. 299/2007 reg 81 (checked by the user before use)'},
        {id:'e-train',q:'Is this work within your training?',hint:'Fixed wiring and boards are for a competent electrician.',ok:'yes',sure:'You are trained for this work.',
          says:'Within training',hold:'This needs a competent electrician.',clear:'The FM arranges one.',basis:'S.I. 299/2007 reg 88'}]},
      'hot-work':{label:'Hot work',short:'Hot work',icon:'flame',wear:['M004','M009'],ask:'Before you use heat or flame',qs:[
        {id:'w-permit',q:'Hot work needs a permit to work',hint:'Flame, sparks or a heat gun.',ok:'none',says:'Permit',
          hold:'Hot work needs a permit to work.',clear:'The FM or the permit issuer issues it, from their phone or the desk.',permit:'Hot Works',
          basis:'Fire Services Act 1981 s.18(2), (3); the site’s permit rule (DEC-0313 rule 3)'},
        {id:'w-clear',q:'Anything that can burn cleared or covered?',hint:'Paper, fabric, dust, sprays, fuel.',ok:'yes',sure:'Things that can burn are moved away or covered.',says:'Burnables cleared',
          sort:'I’ll Clear Them First',basis:'Fire Services Act 1981 s.18(3)'},
        {id:'w-ext',q:'Fire extinguisher within reach?',hint:'The right type, in your hand’s reach.',ok:'yes',sure:'A fire extinguisher is near you.',says:'Extinguisher to hand',
          sort:'I’ll Get One First',basis:'Fire Services Act 1981 s.18(2)'},
        {id:'w-watch',q:'Someone watching for fire, during and after?',hint:'Not you. They stay on after you stop.',ok:'yes',sure:'Another person watches for fire, during and after.',says:'Fire watch',
          sort:'I’ll Get Someone',basis:'Fire Services Act 1981 s.18(2); insurer and industry practice'}]},
      'hot-water':{label:'Water and hot surfaces',short:'Hot water',icon:'thermometer-sun',sign:'W017',wear:['M009'],ask:'Before you work on pipes or tanks',qs:[
        {id:'t-off',q:'Supply off and pressure let off?',hint:'Before you open a pipe, valve or tank.',ok:'yes',sure:'The water is turned off. There is no pressure in the pipe.',says:'Off, pressure let off',
          sort:'I’ll Turn It Off First',basis:'Safety, Health and Welfare at Work Act 2005 s.19'},
        {id:'t-cool',q:'Cool enough to touch?',hint:'Pipes, rads and cylinders can scald.',ok:'yes',sure:'Pipes and tanks are cool. You can touch them.',says:'Cool to touch',
          sort:'I’ll Let It Cool',basis:'Safety, Health and Welfare at Work Act 2005 s.19'},
        {id:'t-dry',q:'Water kept off electrics and the floor?',hint:'Cover sockets. Mop up as you go.',ok:'yes',sure:'No water near electrics. The floor is dry.',says:'Water kept off',
          sort:'I’ll Cover and Mop',basis:'Safety, Health and Welfare at Work Act 2005 s.19'}]},
      chemicals:{label:'Chemicals',short:'Chemicals',icon:'flask-conical',wear:['M004','M009','M026'],ask:'Before you use chemicals',qs:[
        {id:'c-sds',q:'Read the label or data sheet?',hint:'It says what to wear and what not to mix.',ok:'yes',sure:'You read the label on the product.',says:'Label read',
          sort:'I’ll Read It First',basis:'S.I. 619/2001 reg 4 (the supplier’s safety data sheet)'},
        {id:'c-mix',q:'One product at a time, never mixed?',hint:'Mixing cleaners can make a toxic gas.',ok:'yes',sure:'You use one product. You do not mix products.',says:'Never mixed',
          sort:'I’ll Use One at a Time',basis:'S.I. 619/2001 reg 5; the product’s label'},
        {id:'c-air',q:'Room aired, and people kept out till dry?',hint:'Open a window. Sign the door.',ok:'yes',sure:'The window is open. People stay out until it is dry.',says:'Aired, people kept out',
          sort:'I’ll Air It and Sign It',basis:'S.I. 619/2001 reg 5; Safety, Health and Welfare at Work Act 2005 s.12'}]},
      confined:{label:'A confined space',short:'Confined space',icon:'cylinder',wear:[],ask:'Before you go in',qs:[
        {id:'s-permit',q:'Going into a confined space needs a permit',hint:'A tank, pit, duct, void, manhole or crawl space.',ok:'none',says:'Permit',
          hold:'Entry needs a permit to work.',clear:'The FM or the permit issuer issues it, from their phone or the desk.',permit:'Confined Space',
          basis:'S.I. 218/2001 reg 5; the site’s permit rule (DEC-0313 rule 3)'},
        {id:'s-watch',q:'Someone outside who can see you?',hint:'They stay at the entrance the whole time.',ok:'yes',sure:'A person outside can see you all the time.',says:'Someone outside',
          hold:'No one goes in without someone outside.',clear:'The FM arranges it with the permit.',basis:'S.I. 218/2001 reg 6'},
        {id:'s-rescue',q:'Rescue plan ready?',hint:'How you would be got out, and with what.',ok:'yes',sure:'There is a plan to get you out.',says:'Rescue plan ready',
          hold:'No one goes in without a rescue plan.',clear:'The FM arranges it with the permit.',basis:'S.I. 218/2001 reg 6(1)'}]},
      alone:{label:'Working alone',short:'Working alone',icon:'user',wear:[],ask:'You are working alone',qs:[
        {id:'a-told',q:'Someone knows where you are, and till when?',hint:'Reception or the person on duty.',ok:'yes',sure:'Someone knows where you are and when you finish.',says:'Someone told',
          sort:'I’ll Tell Someone Now',basis:'Safety, Health and Welfare at Work Act 2005 s.19; HSA guidance on lone working'},
        {id:'a-phone',q:'Phone charged and on you?',hint:'In your pocket, not in the van.',ok:'yes',sure:'Your phone is charged and with you.',says:'Phone on you',
          sort:'I’ll Get It First',basis:'HSA guidance on lone working (a way to keep in contact)'}]},
      public:{label:'Residents or the public in the area',short:'Residents nearby',icon:'users',wear:[],ask:'Residents are near',qs:[
        // A site whose set-up records no child residents is asked noChildren instead (DEC-0384 rule 2, DEC-0338 rule 3).
        {id:'p-keep',q:'Residents and children kept out?',noChildren:'Residents kept out?',sure:'Residents and children cannot come in.',sureNoChildren:'Residents cannot come in.',hint:'Lock the door, cone it off or sign it.',ok:'yes',says:'Residents kept out',
          sort:'I’ll Close It Off',basis:'Safety, Health and Welfare at Work Act 2005 s.12'},
        {id:'p-reach',q:'Tools and chemicals out of reach?',hint:'Even when you step away.',ok:'yes',sure:'Residents cannot reach your tools or chemicals.',says:'Tools out of reach',
          sort:'I’ll Take Them With Me',basis:'Safety, Health and Welfare at Work Act 2005 s.12'},
        {id:'p-exit',q:'Escape routes and fire doors still clear?',hint:'Nothing left in a corridor or wedging a door.',ok:'yes',sure:'Fire exits and fire doors are not blocked.',says:'Escape routes clear',
          sort:'I’ll Clear Them',basis:'Fire Services Act 1981 s.18(2)'}]},
      // Manual handling (DEC-0383 rule 5): no ISO 7010 sign means it, so a Lucide picture (DEC-0342 rule 3). The
      // questions are S.I. 299/2007 reg 69(a) and Schedule 3 items 1 and 3, read on revisedacts.lawreform.ie, 28 Oct 2026.
      manual:{label:'Manual handling',short:'Manual handling',icon:'package',wear:[],ask:'Before you lift or carry',qs:[
        {id:'m-aid',q:'Trolley, sack truck or a second person used?',hint:'Wheel it if you can. Do not carry what a trolley can.',ok:'yes',sure:'You use a trolley, or another person helps.',
          says:'Trolley or help used',sort:'I’ll Get a Trolley',basis:'S.I. 299/2007 reg 69(a)'},
        {id:'m-load',q:'Light enough to hold close, with a good grip?',hint:'Test it first. Too heavy, too big or awkward: get help.',ok:'yes',sure:'You can hold it close to your body.',
          says:'Held close, good grip',sort:'I’ll Get Help',basis:'S.I. 299/2007 Schedule 3, item 1'},
        {id:'m-route',q:'Route clear, floor dry, nothing to climb?',hint:'Clear the way before you lift.',ok:'yes',sure:'The way is clear and the floor is dry.',
          says:'Route clear',sort:'I’ll Clear the Way',basis:'S.I. 299/2007 Schedule 3, item 3'}]}
    },
    // Each hazard's picture as the phone draws it (Lucide, one stroke 1.75 on a 24px grid; Design 21.7), so the desk's
    // Before You Start page draws the same one (DEC-0383 rule 1).
    icons:{
      'arrow-up-from-line':'<path d="m18 9-6-6-6 6"/><path d="M12 3v14"/><path d="M5 21h14"/>',
      'zap':'<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
      'flame':'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
      'thermometer-sun':'<path d="M12 9a4 4 0 0 0-2 7.5"/><path d="M12 3v2"/><path d="m6.6 18.4-1.4 1.4"/><path d="M20 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/><path d="M4 13H2"/><path d="M6.34 7.34 4.93 5.93"/>',
      'flask-conical':'<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
      'cylinder':'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/>',
      'user':'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      'users':'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      'package':'<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/>'},
    // A hazard the product has no questions for yet, so the phone never asks it; the desk page says so with what the
    // site's set-up answers (DEC-0383 rule 3).
    notYet:[{id:'asbestos',label:'A suspected asbestos area',setup:'hasAsbestos'}],
    // No question is asked of every job (DEC-0360 rule 5): "Tools in working order?" was a yes nearly every time and helped
    // no one assess. A check sent before keeps its answer in its own words.
    every:[],
    // What to wear (DEC-0346): common sense from S.I. 299/2007 Schedule 2 as replaced by S.I. 610/2021, Part C. Nothing on
    // every job: safety boots are the uniform (DEC-0360 rule 6). A hard hat from an extension ladder up (John's line, about
    // 2 metres: never asked, told from what the work is done from); a harness on a roof or from a lift. Working from above
    // a stepladder needs the Working at Height permit (heightFrom's permit:true).
    everyWear:[],
    fromWear:{ladder:['M014'],tower:['M014'],scaffold:['M014'],roof:['M014','M018'],mewp:['M014','M018']},
    wearBasis:'S.I. 299/2007 Schedule 2, as replaced by S.I. 610/2021, Part C; DEC-0346',
    // Mark Done (DEC-0341 rule 8): `when` names the hazard that must have been tapped; `ask` is the answer that asks what.
    // `sure` is the sentence the phone shows, true when the answer is `ok` (DEC-0412): a line slid over or tapped is its fine answer.
    finish:[{id:'f-back',q:'All tools and materials returned?',ok:'yes',sure:'All tools and materials are returned.'},
      {id:'f-clear',q:'Work area inspected and clear?',ok:'yes',sure:'The work area is inspected and clear.'},
      {id:'f-power',q:'Power back on, covers back on?',ok:'yes',when:'electricity',sure:'Power is back on and covers are back on.'},
      {id:'f-new',q:'Anything new or not as expected?',ok:'no',ask:'yes',askQ:'What did you find?',sure:'Nothing new or unexpected.'}],
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
  // A chat group (DEC-0365) carries act (one of groupActs) and chatGroup:{name, roles}, roles being the titles of positions on
  // the Organisation Structure; whoever holds one is in it. An edit or a close names its group in chat. A made group's id is
  // the capture that made it. Only the FM's are applied; nothing about a group is erased (DEC-0353).
  groupActs:['make','edit','close'],
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
  // A job done in the last doneDays stays on the phone, under Done, with its photos (DEC-0349 rule 1).
  doneDays:7,
  // Open jobs' voice notes for the phone (P6), as the photos are: the sound as base64 text in Phone/audio/, named per
  // entry in the thread with its type and length.
  audio:{folder:'audio', ext:'.b64', keepDays:7},
  // A job's thread on the phone: its last entries, oldest first (DEC-0307 rule 2).
  threadMax:30,
  // Messages (DEC-0348): the relay keeps an index of notices, reads and handovers beside the Inbox (Messages/index.json),
  // text only, so they reach phones whether the desk is open or not. Phones are shown the last keepDays days; older ones are
  // archived beside it (Messages/archive-YYYY-MM.json). A message is a record and is never deleted (DEC-0353).
  messages:{folder:'Messages', index:'index.json', format:'waterline-messages', keepDays:60},
  // The relay's copy of each permit applied for from a phone and its answer (DEC-0359 rule 3), so the applicant can start
  // with the desk shut. Kept keepDays; the desk's register is the record.
  permits:{folder:'Permits', index:'index.json', format:'waterline-permits', keepDays:30}
};
