const express = require("express");
const router = express.Router();
const TeacherController = require("../controllers/teacherController");
const StudentController = require("../controllers/studentController");
const commonMiddleWare = require("../middlewares/auth");

router.get("/testme", function (req, res) {
  res.send("all good");
});

//******Teacher ********* */

//teacher register
router.post("/createTeacher", TeacherController.createTeacher);

//login
router.post("/teacherLogin", TeacherController.teacherLogin);

//******Student ********* */

//add student
router.post(
  "/addStudent",
  commonMiddleWare.authentication,
  StudentController.createStudent
);

//update student details
router.put(
  "/student/:studentId",
  commonMiddleWare.authentication,
  commonMiddleWare.authorization,
  StudentController.updateStudent
);

//Delete a Student
router.delete(
  "/student/:studentId",
  commonMiddleWare.authentication,
  commonMiddleWare.authorization,
  StudentController.deleteStudent
);

//Student List
router.get(
  "/getstudent/",commonMiddleWare.authentication,StudentController.studentList)


router.all("/*", function (req, res) {
  res.status(400).send({ status: false, message: "invalid http request" });
});

module.exports = router;
