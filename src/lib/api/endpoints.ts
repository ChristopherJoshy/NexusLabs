/** SJCET Palai is the only supported Etlab installation. */
export const SJCET_HOST = 'sjcetpalai.etlab.in';
export const SJCET_SITE_URL = `https://${SJCET_HOST}/`;
export const SJCET_BASE_URL = `${SJCET_SITE_URL}androidapp/`;
export const SJCET_COLLEGE = {
  clgId: 0,
  base_url: SJCET_SITE_URL,
  regUrl: 'https://sjcetpalai.ac.in/',
  clgName: 'St. Joseph’s College of Engineering and Technology, Palai',
} as const;

/** Paths identified in the shipped Etlab Android client; payload details are documented as provisional. */
export const ENDPOINTS = {
  login: 'app/login',
  dashboard: 'app/profile',
  attendanceBySubject: 'app/attendancebysubject',
  attendanceByDay: 'app/attendancebydayperiod',
  assignments: 'app/assignments',
  timetable: 'app/timetablenew',
  dayTimetable: 'app/datewisetimetable',
  notices: 'app/noticeboard',
  semesters: 'app/semesterlist',
  assignmentResults: 'app/resultassignment',
  internalMarks: 'app/resultinternal',
  moduleTestResults: 'app/resultmoduletest',
  seasonalResults: 'app/resultsessional',
  selfStudyResults: 'app/resultselfstudy',
  tutorialResults: 'app/resulttutorials',
  universityResults: 'app/resultsuniversity',
  seriesExam: 'app/seriesexam',
  studyMaterials: 'app/studymaterials',
  calendar: 'app/calendarevents',
  profile: 'app/getstudentdetails',
  leaveList: 'app/viewstudentleave',
  fees: 'fee/academicfees',
} as const;
