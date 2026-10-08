-- A lecturer can teach several subjects: replace the single Lecturer.subjectId
-- with a many-to-many link table.
--
-- Deliberately additive ("expand" step): the old Lecturer.subjectId column is
-- kept for now so the code currently running on the live site keeps working
-- until the new version is deployed. A later migration drops it.

-- CreateTable
CREATE TABLE "_LecturerSubjects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LecturerSubjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LecturerSubjects_B_index" ON "_LecturerSubjects"("B");

-- AddForeignKey
ALTER TABLE "_LecturerSubjects" ADD CONSTRAINT "_LecturerSubjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Lecturer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LecturerSubjects" ADD CONSTRAINT "_LecturerSubjects_B_fkey" FOREIGN KEY ("B") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry over each lecturer's existing subject.
INSERT INTO "_LecturerSubjects" ("A", "B")
SELECT "id", "subjectId" FROM "Lecturer" WHERE "subjectId" IS NOT NULL;