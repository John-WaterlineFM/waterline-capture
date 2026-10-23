// Written by tools/companion_shapes.py from Carnbeg_v492.html. Do not edit: run the tool again.
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
    job:        {direction:'operational', label:'Job update'}
  },
  // Every field of version 1. Required: format, version, id, kind, taken, person.
  fields:['format','version','id','kind','taken','person','account','place','loc','note','outcome','reading','duty','plan','device','files','round','started','scans','point','group','record','answers','unscanned','complete','signedOff','job','act','msgKind','flag','assign','secs','entry','check','parts','permit'],
  required:['format','version','id','kind','taken','person'],
  // Records 7.5: an observational photo proves presence, time and person, and nothing else. Say exactly that.
  photoSays:'This photo proves who was there, where and when, and nothing else.',
  // What a job update does (P3). P5 (DEC-0311, DEC-0314): pause carries its reason in note; assign carries
  // assign:{on:[person ids],off:[person ids]}.
  jobActs:['note','flag','unflag','start','done','pause','restart','assign','edit','delete','parts','permit'],
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
  // Edit and delete (DEC-0321): `entry` names the message changed by its capture id; an edit carries its new words in note.
  // What a person writes on a job's thread (DEC-0307 rule 2). The desk writes the other kinds as it changes the job.
  msgKinds:['Note','Handover','Investigation','Parts needed','Resident said'],
  // A voice note (P6; DEC-0317 rule 3, DEC-0318 rule 4, DEC-0319 rule 2): one sound file on a job note, of these types,
  // up to soundMaxSecs long, its length in secs. A note sent with no words is filed with noWords, never blank.
  sounds:['audio/mp4','audio/webm'], soundMaxSecs:120, noWords:'Voice note, no words given',
  deskKinds:['Raised','Flagged','Assigned','Started','Paused','Restarted','Done','Safety check','Parts used','Permit'],
  // A flag's level, in order (DEC-0304): words, never a colour. What each means in time is John's to rule (rule 4).
  flagLevels:[{id:'urgent',label:'Urgent'},{id:'asap',label:'As soon as possible'},{id:'week',label:'This week'},{id:'able',label:'When able'},{id:'planned',label:'When planned'}]
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
  threadMax:30
};
