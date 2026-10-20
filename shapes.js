// Written by tools/companion_shapes.py from Carnbeg_v479.html. Do not edit: run the tool again.
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
  fields:['format','version','id','kind','taken','person','account','place','loc','note','outcome','reading','duty','device','files','round','started','scans','point','group','record','answers','unscanned','complete','signedOff','job','act','msgKind','flag','assign'],
  required:['format','version','id','kind','taken','person'],
  // Records 7.5: an observational photo proves presence, time and person, and nothing else. Say exactly that.
  photoSays:'This photo proves who was there, where and when, and nothing else.',
  // What a job update does (P3). P5 (DEC-0311, DEC-0314): pause carries its reason in note; assign carries
  // assign:{on:[person ids],off:[person ids]}.
  jobActs:['note','flag','unflag','start','done','pause','restart','assign'],
  // What a person writes on a job's thread (DEC-0307 rule 2). The desk writes the other kinds as it changes the job.
  msgKinds:['Note','Handover','Investigation','Parts needed','Resident said'],
  deskKinds:['Raised','Flagged','Assigned','Started','Paused','Restarted','Done'],
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
  // A job's thread on the phone: its last entries, oldest first (DEC-0307 rule 2).
  threadMax:30
};
