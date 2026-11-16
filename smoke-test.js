const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const script = fs.readFileSync("script.js", "utf8");
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
const references = [...script.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)/g)].map(match => match[1]);
const missingIds = [...new Set(references.filter(id => !ids.includes(id)))];
const required = [
  "client-mm", "client-it", "staff-mm", "staff-it", "staff-process",
  "roomAssignments",
  "renderOwnWorkspace", "openClientDetail", "page-client-detail",
  "openAppointmentResponseDialog", "respondToAppointment", "appointmentResponseDialog",
  "communicationPublishUntil", "manageMessagePublishUntil", "communicationEventDetails", "manageMessageEventDetails", "data-event-response", "data-rich-link-toggle", "roomBatchDialog", "saveRoomBatchSelection", "createAccountFromForm", "profilePasswordForm", "syncClientWeekdaysFromAssignments",
  'data-widget-id="tasks"', "dashboardKanban"
];
const missingFeatures = required.filter(token => !script.includes(token) && !html.includes(token));
const forbidden = ["communicationType", "communicationEventFields", "manageMessageImportant", "communicationImportant", "addEventButton", "page-events", "data-widget-id=\"events\"", "eventDialog", "eventManageDialog","clientDetailNewAppointment", 'data-room-view="day"', 'id="roomDayTabs"'];
const forbiddenFeatures = forbidden.filter(token => script.includes(token) || html.includes(token));

console.log(JSON.stringify({
  htmlIds: ids.length,
  jsIdReferences: new Set(references).size,
  duplicates,
  missingIds,
  missingFeatures,
  forbiddenFeatures
}, null, 2));

if (duplicates.length || missingIds.length || missingFeatures.length || forbiddenFeatures.length) process.exit(1);
