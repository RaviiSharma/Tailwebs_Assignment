const studentModel = require('../models/studentModel')
const teacherModel = require('../models/teacherModel')
const mongoose = require('mongoose');

//******VALIDATIONS********/

const isValid = function (value) {
    if (typeof (value) === 'undefined' || value === null) return false
    if (typeof (value) === 'string' && value.trim().length == 0) return false
    return true
}

const isValidRequestBody = function (reqBody) {
    return Object.keys(reqBody).length > 0
}


//******CREATE STUDENT********/

const createStudent = async function (req, res) {

    try {

        const queryParams = req.query
        const requestBody = req.body
        const decodedToken = req.decodedToken;

        if (isValidRequestBody(queryParams)) {
            return res
                .status(400)
                .send({ status: false, message: "invalid request" })
        }

        if (!isValidRequestBody(requestBody)) {
            return res
                .status(400)
                .send({ status: false, message: "please provide input data" });
        }

        const { name, subject, marks, teacherName } = requestBody

        if (!isValid(name)) {
            return res
                .status(400)
                .send({ status: false, message: "name must be provided" });
        }

        if (!isValid(subject)) {
            return res
                .status(400)
                .send({ status: false, message: "subject must be Provided" });
        }

        if (!["English", "Hindi", "Maths", "Science"].includes(subject)) {
            return res
                .status(400)
                .send({ status: false, message: "subject is required and its value must be either English/Hindi/Maths/Science" });
        }


        if (!isValid(marks)) {
            return res
                .status(400)
                .send({ status: false, message: "marks must be provided" })
        }

        if (! /^0*[1-9]\d*$/.test(marks)) {
            return res
                .status(400)
                .send({ status: false, message: "enter a valid marks" })
        }


        if (!isValid(teacherName)) {
            return res
                .status(400)
                .send({ status: false, message: "teacher name must be provided" })
        }

        const teacherByTeacherName = await teacherModel.findOne({ name: teacherName })

        if (!teacherByTeacherName) {
            return res
                .status(404)
                .send({ status: false, message: `no teacher found by name: ${teacherName}` })
        }
        // console.log(teacherByTeacherName)

        const teacherId = teacherByTeacherName._id

        requestBody.teacherId = teacherId

        delete requestBody.teacherName

        if (decodedToken.teacherId != teacherId) {
            return res
                .status(403)
                .send({ status: false, message: "unauthorized Access" })
        }

        const studentDataByNameMarks = await studentModel.findOne({ name: name, subject: subject , isDeleted: false })

        // console.log(studentDataByNameMarks)


        if (studentDataByNameMarks) {

            let studentId = studentDataByNameMarks._id;
            // console.log(studentId)

            let studentData = await studentModel.findOneAndUpdate({ _id: studentId }, {
                $inc: {
                    marks: marks
                },
            }, { new: true, upsert: true });

            res
                .status(201)
                .send({ status: true, message: `student already exits with ${subject} so marks updated`, data: studentData })

        } else {

            const newStudent = await studentModel.create(requestBody)

            res
                .status(201)
                .send({ status: true, message: "new student entry done", data: newStudent })

        }

    } catch (error) {

        res
            .status(500)
            .send({ error: error.message })

    }
}

//*************ALL STUDENT LIST & FILTERED STUDENT LIST**************/

const studentList = async function (req, res) {

    try {

        const requestBody = req.body;
        const queryParams = req.query;
        const decodedToken = req.decodedToken;

        let teachetByTeacherId = decodedToken.teacherId

        let teacherData = await teacherModel.findById(teachetByTeacherId)
        // console.log(teacherData)
        let teacherName = teacherData.name
        // console.log(teacherName)

        const filterConditions = {
            teacherId: teachetByTeacherId,
            isDeleted: false
        };

        if (isValidRequestBody(requestBody)) {
            return res
                .status(400)
                .send({ status: false, message: "data is not required in body" });
        }

        // if filters are provided then validating each filter then adding it to filterCondition object
        if (isValidRequestBody(queryParams)) {

            const { name, subject } = queryParams;

            if (queryParams.hasOwnProperty("name")) {
                if (isValid(name)) {

                    // creating regex for name
                    const regexForName = new RegExp(name, "i");
                    filterConditions["name"] = { $regex: regexForName };

                } else {
                    return res
                        .status(400)
                        .send({ status: false, message: "enter a valid name" });
                }
            }

            if (queryParams.hasOwnProperty("subject")) {
                if (isValid(subject) && ["English", "Hindi", "Maths", "Science"].includes(subject)) {

                    filterConditions["subject"] = subject.trim();

                } else {
                    return res
                        .status(400)
                        .send({ status: false, message: `enter a valid subject and it should be either English/Hindi/Maths/Science` });
                }
            }

            const studentListAfterFiltration = await studentModel.find(filterConditions)
                .select({
                    _id: 0,
                    name: 1,
                    subject: 1,
                    marks: 1
                })

            if (studentListAfterFiltration.length == 0) {
                return res
                    .status(404)
                    .send({ status: false, message: "no student found" });
            }

            res
                .status(200)
                .send({ status: true, message: `Filtered students of Teacher:- ${teacherName}`, studentCount: studentListAfterFiltration.length, studentList: studentListAfterFiltration });

            // if filters are not provided
        } else {

            const studentList = await studentModel.find(filterConditions)
                .select({
                    _id: 0,
                    name: 1,
                    subject: 1,
                    marks: 1
                })


            if (studentList.length == 0) {
                return res
                    .status(404)
                    .send({ status: false, message: "no student found" });
            }

            res
                .status(200)
                .send({ status: true, message: `All students of Teacher:- ${teacherName}`, studentCount: studentList.length, studentList: studentList, });

        }
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
};



//***********UPDATE STUDENT DETAILS***********/

const updateStudent = async function (req, res) {
    try {
        const requestBody = req.body;
        const queryParam = req.query;
        const studentId = req.params.studentId;

        // query params should be empty
        if (isValidRequestBody(queryParam)) {
            return res
                .status(400)
                .send({ status: false, message: "invalid request" });
        }

        if (!isValidRequestBody(requestBody)) {
            return res
                .status(400)
                .send({ status: false, message: "input data is required for update" });
        }

        if (!studentId) {
            return res
                .status(400)
                .send({ status: false, message: "studentId is required in path params" });
        }

        if (mongoose.Types.ObjectId.isValid(studentId) == false) {
            return res
                .status(400)
                .send({ status: false, message: "studentId is not valid" });
        }

        let studentBystudentId = await studentModel.findOne({ _id: studentId })

        if (!studentBystudentId) {
            return res
                .status(400)
                .send({ status: false, message: `no student exits with id ${studentId}` })
        }

        // using destructuring
        const { name, subject, marks } = requestBody;

        // creating an empty object for adding all updates as per requestBody
        const updates = {};

        // if requestBody has the mentioned property then validating that property and adding it to updates object
        if (requestBody.hasOwnProperty("name")) {
            if (isValid(name)) {

                updates["name"] = name.trim();

            } else {
                return res
                    .status(400)
                    .send({ status: false, message: `enter name in valid format` });
            }
        }

        if (requestBody.hasOwnProperty("subject")) {

            if (isValid(subject) && ["English", "Hindi", "Maths", "Science"].includes(subject)) {

                updates["subject"] = subject.trim();

            } else {
                return res
                    .status(400)
                    .send({ status: false, message: "enter subject in valid format and it should be either English/Hindi/Maths/Science" });
            }
        }


        if (requestBody.hasOwnProperty("marks")) {
            if (/^0*[1-9]\d*$/.test(marks)) {

                updates["marks"] = marks;

            } else {
                return res
                    .status(400)
                    .send({ status: false, message: "give valid marks" });
            }
        }

        // updating student by the content inside updates object
        const updatedStudentDetails = await studentModel.findOneAndUpdate(
            { _id: studentId, isDeleted: false },
            { $set: updates },
            { new: true }
        );

        res
            .status(200)
            .send({ status: true, message: "student details update successfully", data: updatedStudentDetails });

    } catch (err) {

        res.status(500).send({ error: err.message });

    }
};

//***************DELETING A STUDENT*******************/

const deleteStudent = async function (req, res) {

    try {

        const queryParam = req.query;
        const requestBody = req.body;
        const studentId = req.params.studentId;

        // query params should be empty
        if (isValidRequestBody(queryParam)) {
            return res
                .status(400)
                .send({ status: false, message: "invalid request" });
        }

        if (isValidRequestBody(requestBody)) {
            return res
                .status(400)
                .send({ status: false, message: "input data is not required in request body" });
        }

        if (!studentId) {
            return res
                .status(400)
                .send({ status: false, message: "studentId is required in path params" });
        }

        if (mongoose.Types.ObjectId.isValid(studentId) == false) {
            return res
                .status(400)
                .send({ status: false, message: "studentId is not valid" });
        }

        let studentData = await studentModel.findOne({ _id: studentId })

        if (!studentData) {
            return res
                .status(404)
                .send({ status: false, message: `no student found by this ${studentId}` })
        }

        await studentModel.findByIdAndUpdate(
            studentId,
            { $set: { isDeleted: true } },
            { new: true }
        );

        res
            .status(200)
            .send({ status: true, message: "student Detail deleted successfully" });

    } catch (err) {

        res.status(500).send({ error: err.message });

    }
};

//*******EXPORTING FUNCTIONS******/

module.exports.createStudent = createStudent
module.exports.studentList = studentList
module.exports.updateStudent = updateStudent
module.exports.deleteStudent = deleteStudent