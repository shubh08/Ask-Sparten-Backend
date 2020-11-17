var express = require('express');
var router = express.Router();
var user = require('../models/user');
var question = require('../models/question');
const bcrypt = require('bcrypt');
const saltRounds = 10;
var moment = require('moment');
//const { Mongoose } = require('mongoose');
var mongoose = require('mongoose');


router.post('/signup', function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        if (!err) {
            const name = req.body.name;
            const email = req.body.email;
            const password =hash;
            //const DOB = req.body.DOB;

            const newUser = new user({
                name,
                email,
                password,
            });
            newUser.save((err, user) => {
                if (err) {
                    var error = { message: "User already registered"}
                    next(error);
                } else if (user == null) {
                   next();
                } else {
                    res.status(200).send({ message: "Successful Sign Up", id:user._id});
                }
            })
        } else {
            next();
        }
    }); 
});

router.post('/login', function (req, res, next) {
    user.findOne({ email: req.body.email }).exec((err, user) => {
        if (err) {
           next();
        }
        else if (user == null) {
            var error = { message: "user does not exist"}
            next(error);
        } else {
            bcrypt.compare(req.body.password, user.password, function (err, result) {
                if (result) {
                    res.status(200).send({ message: "Logged In succesfully", id:user._id});
                } else {
                    var error = { message: "Invalid Password"}
                    next(error);
                }
            });
        }
    })
});


router.post('/ask', function (req, res, next) {
    const title = req.body.title;
    const questionText = req.body.questionText;
    const askedBy = req.body.askedBy;
    const tags = req.body.tags
    let time = moment()
    
    //const DOB = req.body.DOB;

    const newQuestion = new question({
        title,
        questionText,
        askedBy,
        time,
        tags
    });
    newQuestion.save((err, question) => {
        if (err) {
            var error = { message: "Some error while posting question"}
            next(error);
        } 
        else {
            res.status(200).send({ message: "Question Posted Successfully", id:question._id});
        }
    })
});


router.get('/loadQuestions', function (req, res, next) {
    question.find().exec((err, questions) => {
        if (err) {
            next(err);
        } else {
            console.log('questions', questions)
            res.status(200).send({ questions: questions });
        }
    });
});



router.post('/answerQuestion', function (req, res, next) {
    console.log("Here in answerQuestion")
    //var id = Mongoose.Types.ObjectId();
    console.log("Here in id", req.body.questionID)
    let answerObject = {   answer : req.body.answer,
         answeredBy : req.body.answeredBy,
        time : moment(),
        acceptStatus : 'false',
        _id : mongoose.Types.ObjectId(),
        upvote : 0,
        downvote : 0,
        upids:[],
        downids:[],
        status:'unset'
    }
    let questionID = req.body.questionID
    console.log("Answer Object", answerObject)
        question.findByIdAndUpdate(questionID, { '$push': { "answers": answerObject } }).exec((err, answer) => {
            if (err || answer == null) {
                console.log("Error", err)
                next(err);
            } else {

                question.findById(questionID).exec((err, questionRes) => {
                    if (err || questionRes == null) {
                        console.log("Error", err)
                        next(err);
                    }
                    else
                    {
                        res.status(200).send({ message: "Answer posted Successfully", question :questionRes });
                    }
                    } )
            }
        })
});


router.put('/acceptAnswer', function (req, res, next) {
    console.log("Here in acceptAnswer")
    let questionID = req.body.questionID
    let answerID = req.body.answerID
    console.log("Question ID", questionID, "Answer id", answerID)

    question.findById(questionID).exec((err, questionRes) => {
        if (err || questionRes == null) {
            console.log("Error", err)
            next(err);
        } else {

            console.log('Answers array', questionRes.answers)
            let answersArray = questionRes.answers
            for(let i=0;i<answersArray.length;i++)
            {
                if(answersArray[i]._id == answerID)
                {
                    console.log('Here in the match')
                    answersArray[i].acceptStatus = 'true'
                }
            }
            console.log('After modification', questionRes)
            const newQuestion = new question(questionRes);
            newQuestion.save((err, ques) => {
                if (err) {
                    var error = { message: "Error while saving question"}
                    next(error);
                } else if (ques == null) {
                   next();
                } else {
                    res.status(200).send({ message: "Successful accept status", id:ques._id});
                }
            })
        }
    })

});


router.put('/upvoteAnswer', function (req, res, next) {
    console.log("Here in upvote Answer")
    let questionID = req.body.questionID
    let answerID = req.body.answerID
    let userID = req.body.userID
    console.log("Question ID", questionID, "Answer id", answerID)

    question.findById(questionID).exec((err, questionRes) => {
        if (err || questionRes == null) {
            console.log("Error", err)
            next(err);
        } else {

            console.log('Answers array', questionRes.answers)
            let answersArray = questionRes.answers
            let flag = 'unset'
            for(let i=0;i<answersArray.length;i++)
            {
                if(answersArray[i]._id == answerID)
                {
                    console.log('Here in the match')
                    console.log('Type of strucutre',answersArray[i].downids)
                    if(answersArray[i].downids.includes(userID))
                    {
                        answersArray[i].downids.splice(answersArray[i].downids.indexOf(userID), 1);
                        answersArray[i].downvote -= 1;
                    }
                    
                    if(answersArray[i].upids.includes(userID))
                    {   
                        answersArray[i].upids.splice(answersArray[i].upids.indexOf(userID), 1);
                        answersArray[i].upvote -= 1;
                        answersArray[i].status = 'unset'
                        break;
                    }
                    else
                    {
                        answersArray[i].upvote += 1;
                        answersArray[i].upids.push(userID)
                        flag = 'upvote'
                    }
                    answersArray[i].status = flag
                }
            }
            console.log('After modification upvote', questionRes)
            const newQuestion = new question(questionRes);
            newQuestion.save((err, ques) => {
                if (err) {
                    var error = { message: "Error while upvoting"}
                    next(error);
                } else if (ques == null) {
                   next();
                } else {
                    questionRes.flag = flag;
                    console.log('Question final on UI is', questionRes)
                    res.status(200).send({ message: "vote id sucess", question:questionRes});
                }
            })
        }
    })

});



router.put('/downvoteAnswer', function (req, res, next) {
    console.log("Here in downvote Answer")
    let questionID = req.body.questionID
    let answerID = req.body.answerID
    let userID = req.body.userID
    console.log("Question ID", questionID, "Answer id", answerID)

    question.findById(questionID).exec((err, questionRes) => {
        if (err || questionRes == null) {
            console.log("Error", err)
            next(err);
        } else {

            console.log('Answers array', questionRes.answers)
            let answersArray = questionRes.answers
            let flag = 'unset'
            for(let i=0;i<answersArray.length;i++)
            {
                if(answersArray[i]._id == answerID)
                {
                    console.log('Here in the match')
                    console.log('Type of strucutre',answersArray[i].downids)
                    if(answersArray[i].upids.includes(userID))
                    {
                        answersArray[i].upids.splice(answersArray[i].downids.indexOf(userID), 1);
                        answersArray[i].upvote -= 1;
                    }
                    
                    if(answersArray[i].downids.includes(userID))
                    {   
                        answersArray[i].downids.splice(answersArray[i].upids.indexOf(userID), 1);
                        answersArray[i].downvote -= 1;
                        answersArray[i].status = 'unset'
                        break;
                    }
                    else
                    {
                        answersArray[i].downvote += 1;
                        answersArray[i].downids.push(userID)
                        flag = 'downvote'
                    }
                    answersArray[i].status = flag
                }
            }
            console.log('After modification upvote', questionRes)
            const newQuestion = new question(questionRes);
            newQuestion.save((err, ques) => {
                if (err) {
                    var error = { message: "Error while upvoting"}
                    next(error);
                } else if (ques == null) {
                   next();
                } else {
                    questionRes.flag = flag;
                    console.log('Question final on UI is', questionRes)
                    res.status(200).send({ message: "down vote sucess", question:questionRes});
                }
            })
        }
    })

});

router.use((error, req, res, next) => {
    res.writeHead(201, {
        'Content-Type': 'text/plain'
    });
    res.end(JSON.stringify(error));
})

router.use((req, res, next) => {
    var message = [];
    var errors = "Something went wrong!";
    message.push(errors);
    res.writeHead(201, {
        'Content-Type': 'text/plain'
    });
    res.end(JSON.stringify(message));
})

module.exports = router;