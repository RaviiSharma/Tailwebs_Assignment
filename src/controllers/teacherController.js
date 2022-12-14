const TeacherModel = require("../models/teacherModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//*****Validation********/

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length == 0) return false;
  return true;
};

const isValidRequestBody = function (reqBody) {
  return Object.keys(reqBody).length > 0;
};

//**********CREATE TEACHER***********/

const createTeacher = async function (req, res) {
  try {
    const queryParams = req.query;
    const requestBody = req.body;

    if (isValidRequestBody(queryParams)) {
      return res
        .status(400)
        .send({ status: false, message: "invalid request" });
    }

    if (!isValidRequestBody(requestBody)) {
      return res
        .status(400)
        .send({ status: false, message: "please provide input data" });
    }

    const { name, email, password } = requestBody;

    if (Object.keys(requestBody).length > 3) {
      return res
        .status(400)
        .send({
          status: false,
          message: "invalid data entered inside request body",
        });
    }

    if (!isValid(name)) {
      return res
        .status(400)
        .send({ status: false, message: "name is required" });
    }

    const isNameNotUnique = await TeacherModel.findOne({ name: name });

    if (isNameNotUnique) {
      return res
        .status(409)
        .send({ status: false, message: "name already exits" });
    }

    if (!isValid(email)) {
      return res
        .status(400)
        .send({ status: false, message: "email is required" });
    }

    if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
      return res
        .status(400)
        .send({ status: false, message: "enter a valid email" });
    }

    const isemailNotUnique = await TeacherModel.findOne({ email: email });

    if (isemailNotUnique) {
      return res
        .status(409)
        .send({ status: false, message: "email already exits" });
    }

    if (!isValid(password)) {
      return res
        .status(400)
        .send({ status: false, message: "password is required" });
    }

    // password encryption
    const salt = await bcrypt.genSalt(13);
    const encryptedPassword = await bcrypt.hash(password, salt);

    let data = {
      name: name,
      email: email,
      password: encryptedPassword,
    };

    const newTeacherEntry = await TeacherModel.create(data);

    res
      .status(201)
      .send({
        status: true,
        message: "new Teacher entry done",
        data: newTeacherEntry,
      });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//***************TEACHER LOGIN****************** */

const teacherLogin = async function (req, res) {
  try {
    const queryParams = req.query;
    const requestBody = req.body;

    if (isValidRequestBody(queryParams)) {
      return res
        .status(400)
        .send({ status: false, message: "invalid request" });
    }

    if (!isValidRequestBody(requestBody)) {
      return res
        .status(400)
        .send({ status: false, message: "please provide input data" });
    }

    const email = requestBody.email;
    const password = requestBody.password;

    if (
      !isValid(email) ||
      !/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)
    ) {
      return res
        .status(400)
        .send({
          status: false,
          message: "email is required and should be a valid email",
        });
    }

    if (!isValid(password)) {
      return res
        .status(400)
        .send({ status: false, message: "password is required" });
    }

    // finding teacher by given email
    const teacherDetails = await TeacherModel.findOne({ email: email });

    if (!teacherDetails) {
      return res
        .status(404)
        .send({ status: false, message: "no teacher found by email" });
    }

    // comparing hashed password and login password
    const isPasswordMatching = await bcrypt.compare(
      password,
      teacherDetails.password
    );

    if (!isPasswordMatching) {
      return res
        .status(400)
        .send({ status: false, message: "incorrect password" });
    }

    // creating JWT token
    const payload = { teacherId: teacherDetails._id };
    const secretKey = "tailswebsAssigment";

    const token = jwt.sign(payload, secretKey);

    // setting token in response header
    res.header("x-api-key", token);

    const data = { teacherId: teacherDetails._id, token: token };

    res
      .status(200)
      .send({ status: true, message: "login successful", data: data });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
//_________________________________________EXPORTING FUNCTIONS__________________________________________________________________________________________

module.exports.createTeacher = createTeacher;
module.exports.teacherLogin = teacherLogin;
