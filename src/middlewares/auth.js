const jwt = require("jsonwebtoken");
const StudentModel = require("../models/studentModel");
const mongoose = require("mongoose");

//*************AUTHENTICATION*********/

const authentication = async function (req, res, next) {
  const token = req.headers["x-api-key"];
  const secretKey = "tailswebsAssigment";

  if (!token) {
    return res
      .status(401)
      .send({ status: false, message: "Please provide token" });
  }

  try {
    const decodedToken = jwt.verify(token, secretKey);

    if (!decodedToken)
      return res.status(401).send({ status: false, msg: "invalid token" });

    req.decodedToken = decodedToken;

    next();
  } catch (error) {
    res.status(500).send({ error: "authentication failed, please login" });
  }
};

//****************AUTHORIZATION************ */

const authorization = async function (req, res, next) {
  try {
    const studentId = req.params.studentId;
    const decodedToken = req.decodedToken;

    if (mongoose.Types.ObjectId.isValid(studentId) == false) {
      return res
        .status(400)
        .send({ status: false, message: "studentId is not valid" });
    }

    const studentByStudentId = await StudentModel.findOne({
      _id: studentId,
      isDeleted: false,
      deletedAt: null,
    });

    if (!studentByStudentId) {
      return res
        .status(404)
        .send({ status: false, message: `no student found by ${studentId}` });
    }

    if (decodedToken.teacherId != studentByStudentId.teacherId) {
      return res
        .status(403)
        .send({ status: false, message: `unauthorized access` });
    }

    next();
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

//***********EXPORTING BOTH MIDDLEWARE FUNCTIONS************ */

module.exports.authentication = authentication;
module.exports.authorization = authorization;
