-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 25,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TeacherAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeacherAvailability_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoomAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoomAvailability_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleBand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "unitsPerWeek" INTEGER NOT NULL DEFAULT 1,
    "durationSlots" INTEGER NOT NULL DEFAULT 1,
    "itemType" TEXT NOT NULL DEFAULT 'band',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduleBandMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bandId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "teacherId" TEXT,
    "roomId" TEXT,
    "label" TEXT,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleBandMember_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "ScheduleBand" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleBandMember_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleBandMember_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScheduleBandMember_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScheduleBandMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "teacherId" TEXT,
    "bandId" TEXT,
    "title" TEXT,
    "unitsPerWeek" INTEGER NOT NULL,
    "durationSlots" INTEGER NOT NULL DEFAULT 1,
    "itemType" TEXT NOT NULL DEFAULT 'lesson',
    "roomTypeRequired" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "lockedDayOfWeek" INTEGER,
    "lockedSlotIndex" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduleRequirement_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleRequirement_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScheduleRequirement_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScheduleRequirement_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "ScheduleBand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeacherAbsence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "triggeredPlanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeacherAbsence_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeacherAbsence_triggeredPlanId_fkey" FOREIGN KEY ("triggeredPlanId") REFERENCES "SchedulePlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Broadcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "audienceType" TEXT NOT NULL,
    "audienceLabel" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "targetRole" TEXT,
    "targetClassId" TEXT,
    "targetUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Broadcast_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Broadcast_targetClassId_fkey" FOREIGN KEY ("targetClassId") REFERENCES "SchoolClass" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Broadcast_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Broadcast" ("audienceLabel", "audienceType", "createdAt", "createdByUserId", "id", "targetClassId", "targetRole", "text") SELECT "audienceLabel", "audienceType", "createdAt", "createdByUserId", "id", "targetClassId", "targetRole", "text" FROM "Broadcast";
DROP TABLE "Broadcast";
ALTER TABLE "new_Broadcast" RENAME TO "Broadcast";
CREATE TABLE "new_ScheduleConflict" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schedulePlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT true,
    "needsAttention" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleConflict_schedulePlanId_fkey" FOREIGN KEY ("schedulePlanId") REFERENCES "SchedulePlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ScheduleConflict" ("createdAt", "description", "id", "resolved", "schedulePlanId", "severity", "title") SELECT "createdAt", "description", "id", "resolved", "schedulePlanId", "severity", "title" FROM "ScheduleConflict";
DROP TABLE "ScheduleConflict";
ALTER TABLE "new_ScheduleConflict" RENAME TO "ScheduleConflict";
CREATE TABLE "new_SchedulePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "weekStartDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "generationMode" TEXT NOT NULL DEFAULT 'initial',
    "regenerationReason" TEXT,
    "basedOnPlanId" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" DATETIME,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SchedulePlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SchedulePlan_basedOnPlanId_fkey" FOREIGN KEY ("basedOnPlanId") REFERENCES "SchedulePlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SchedulePlan" ("createdAt", "createdById", "generatedAt", "id", "publishedAt", "status", "title", "updatedAt") SELECT "createdAt", "createdById", "generatedAt", "id", "publishedAt", "status", "title", "updatedAt" FROM "SchedulePlan";
DROP TABLE "SchedulePlan";
ALTER TABLE "new_SchedulePlan" RENAME TO "SchedulePlan";
CREATE TABLE "new_ScheduleSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schedulePlanId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "teacherId" TEXT,
    "originalTeacherId" TEXT,
    "roomId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "durationSlots" INTEGER NOT NULL DEFAULT 1,
    "itemType" TEXT NOT NULL DEFAULT 'lesson',
    "title" TEXT,
    "timeLabel" TEXT NOT NULL,
    "split" BOOLEAN NOT NULL DEFAULT false,
    "sourceType" TEXT NOT NULL DEFAULT 'generated',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "bandId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleSlot_schedulePlanId_fkey" FOREIGN KEY ("schedulePlanId") REFERENCES "SchedulePlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleSlot_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleSlot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScheduleSlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScheduleSlot_originalTeacherId_fkey" FOREIGN KEY ("originalTeacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScheduleSlot_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScheduleSlot_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "ScheduleBand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ScheduleSlot" ("classId", "createdAt", "id", "schedulePlanId", "split", "subjectId", "teacherId", "timeLabel") SELECT "classId", "createdAt", "id", "schedulePlanId", "split", "subjectId", "teacherId", "timeLabel" FROM "ScheduleSlot";
DROP TABLE "ScheduleSlot";
ALTER TABLE "new_ScheduleSlot" RENAME TO "ScheduleSlot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAvailability_teacherId_dayOfWeek_slotIndex_key" ON "TeacherAvailability"("teacherId", "dayOfWeek", "slotIndex");

-- CreateIndex
CREATE UNIQUE INDEX "RoomAvailability_roomId_dayOfWeek_slotIndex_key" ON "RoomAvailability"("roomId", "dayOfWeek", "slotIndex");
