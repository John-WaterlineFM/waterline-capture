// Written by tools/companion_shapes.py from Carnbeg_v463.html. Do not edit: run the tool again.
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
    round:      {direction:'proof',       label:'Round'}
  },
  // Every field of version 1. Required: format, version, id, kind, taken, person.
  fields:['format','version','id','kind','taken','person','account','place','note','outcome','reading','duty','device','files','round','started','scans','point','group','record'],
  required:['format','version','id','kind','taken','person'],
  // Records 7.5: an observational photo proves presence, time and person, and nothing else. Say exactly that.
  photoSays:'This photo proves who was there, where and when, and nothing else.'
};
const WFM_SITE_SHAPE={
  format:'waterline-site', version:1,
  folder:'Phone', file:'site.json',
  // A place recurs at this many faults reported in this many days (Principles, Law 7).
  recurAt:2, recurDays:365,
  // Republished at least this often when nothing has changed, so the phone can tell a quiet site
  // from a file the desk has stopped publishing (DEC-0271 rule 4).
  freshHours:12
};
