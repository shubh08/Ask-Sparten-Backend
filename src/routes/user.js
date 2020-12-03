var express = require('express');
var router = express.Router();
var user = require('../models/user');
var question = require('../models/question');
const bcrypt = require('bcrypt');
const saltRounds = 10;
var moment = require('moment');
//const { Mongoose } = require('mongoose');
var mongoose = require('mongoose');
const redis = require('../helpers/Redis');
const client = redis.Client;


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
                    res.status(200).send({ message: "Logged In succesfully", id:user._id,name:user.name, email:user.email});
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
    let time = moment().format("dddd, MMMM Do YYYY, h:mm:ss a");
    
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

            res.status(200).send({ questions: questions.reverse() });
        }
    });
});



router.post('/answerQuestion', function (req, res, next) {
    console.log("Here in answerQuestion")
    //var id = Mongoose.Types.ObjectId();
    console.log("Here in id", req.body.questionID)
    let answerObject = {   answer : req.body.answer,
         answeredBy : req.body.answeredBy,
        time : moment().format("dddd, MMMM Do YYYY, h:mm:ss a"),
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


router.get('/loadQuestion/:id', function (req, res, next) {
    console.log("Here in loadQuestion")
    let questionID = req.params.id
    console.log("Question ID", questionID)

    question.findById(questionID).exec((err, questionRes) => {
        if (err || questionRes == null) {
            var error = { message: "Question not found!"}
            next(error);
        } else {
            let answers = questionRes.answers;
            console.log('Answers here',answers)
            answers.sort(function(a, b) {
                return ((b.upvote - b.downvote) - (a.upvote - a.downvote));
            });
            res.status(200).send({ question : questionRes});
        }
    })

});


router.get('/myQuestions/:id', function (req, res, next) {
    console.log("Here in my Questions")
    let userID = req.params.id
    console.log("User ID", userID)

    question.find({'askedBy.id':userID}).exec((err, questionRes) => {
        if (err || questionRes == null) {
            var error = { message: "Question not found!"}
            next(error);
        } else {
            res.status(200).send({ questions : questionRes});
        }
    })

});


router.get('/myAnswers/:id', function (req, res, next) {
    console.log("Here in my myAnswers")
    let userID = req.params.id
    console.log("User ID", userID)
    let result = []
    question.find().exec((err, questions) => {
        if (err) {
            next(err);
        } else {
            
            for(let i=0;i<questions.length;i++)
            {
                let answerIDS = questions[i].answers
                console.log('Answer IDS', answerIDS)
                for(let k=0;k<answerIDS.length;k++)
                {
                    if(answerIDS[k].answeredBy!=undefined && answerIDS[k].answeredBy.id==userID)
                    {
                        console.log('questions matched', questions[i])
                        result.push(questions[i]);
                        break;
                    }
                }
            }
            res.status(200).send({ questions: result });
        }
    });

});


router.get('/loadQuestion/:id', function (req, res, next) {
    console.log("Here in loadquestion by id")
    let questionID = req.params.id
    console.log("Question ID", questionID)

    question.findById(questionID).exec((err, questionRes) => {
        if (err || questionRes == null) {
            var error = { message: "Question not found!"}
            next(error);
        } else {
            res.status(200).send({ question : questionRes});
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
            questionRes.acceptStatus = 'true'
            
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

router.post('/search', function (req, res, next) {
    console.log('Inside search functionality', JSON.stringify(req.body))
    const type = req.body.type
    const searchQuery = req.body.searchQuery.toLowerCase()
    const searchResult = []
    const searchObj = {
        type : req.body.type,
        searchQuery : req.body.searchQuery.toLowerCase()
    }

    const search = JSON.stringify(searchObj);
    
   // Try fetching the result from Redis first in case we have it cached
    return client.get(search, (err, searchInfo) => {
    
       // If that key exists in Redis store
       if (searchInfo) {
   
           //return res.json({ source: 'cache', data: JSON.parse(photos) })
                       console.log('Data Returned from Redis searchInfo@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@',searchInfo);
                       res.status(200).send({ questions: JSON.parse(searchInfo) });
       } else {
        console.log('Data Not found in  Redis GetProfile--------------------------------------------------------------------------------------------------------');
        
        question.find().exec((err, questions) => {
            if (err) {
                var error = { message: "Error while searching"}
                next(error);
                //next(err);
            } else {
                console.log('questions', questions)
                if(type=='tag')
                {
                    questions.forEach(question => {
                        for(let tag of question.tags)
                        console.log("tag", tag)
                        console.log("type of Question Tags",typeof question.tags)
                        if(question.tags.includes(searchQuery))
                        searchResult.push(question)
                    });
                }
                else
                {
                    questions.forEach(question => {
                        if(question.title.toLowerCase().includes(searchQuery) || question.questionText.toLowerCase().includes(searchQuery))
                        searchResult.push(question)
                    });
                }
                // Save the  API response in Redis store,  data expire time in 3600 seconds, it means one hour
                client.setex(search, 600,JSON.stringify(searchResult))
                res.status(200).send({ questions: searchResult });
            }
        });


       }
    
    }
    )



   
});



router.use((error, req, res, next) => {
    res.writeHead(201, {
        'Content-Type': 'application/json'
    });
    res.end(JSON.stringify(error));
})

router.use((req, res, next) => {
    var message = [];
    var errors = "Something went wrong!";
    message.push(errors);
    res.writeHead(201, {
        'Content-Type': 'application/json'
    });
    res.end(JSON.stringify(message));
})

module.exports = router;