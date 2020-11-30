var chai = require('chai'), chaiHttp = require('chai-http');

chai.use(chaiHttp);

var expect = chai.expect;

it("Should search the application for questions and return questions", function(done){
    chai.request('http://localhost:3010')
    .post('/user/search')
    .send({  "type":"text",
    "searchQuery":"begins"})
    .end(function (err, res) {
        expect(res).to.have.status(200);
        done();
    });
})


it("Should answer a question and return status code", function(done){
    chai.request('http://localhost:3010')
    .post('/user/answerQuestion')
    .send({  "questionID":"5fbe2d308a729dcd714b3003",
    "answer" :"answer Testing",
    "answeredBy" :{"name":"Shubham", "id":"5fb5fe8523e4bc4903266379"}})
    .end(function (err, res) {
        expect(res).to.have.status(200);
        done();
    });
})


it("Should accept a answer and return status code", function(done){
    chai.request('http://localhost:3010')
    .put('/user/acceptAnswer')
    .send({ "questionID":"5fbe2d308a729dcd714b3003",
    "answerID":"5fc1f8b01e5bd5fcdac7f100"})
    .end(function (err, res) {
        expect(res).to.have.status(200);
        done();
    });
})

it("Should upvote a answer and return status code", function(done){
    chai.request('http://localhost:3010')
    .put('/user/acceptAnswer')
    .send({"questionID":"5fbe2d308a729dcd714b3003",
    "answerID":"5fc1f8b01e5bd5fcdac7f100",
    "userID":"5fb35a7a8229a90ec8247443"})
    .end(function (err, res) {
        expect(res).to.have.status(200);
        done();
    });
})


it("Should load questions and return status code", function(done){
    chai.request('http://localhost:3010')
    .get('/user/loadQuestions')
    .end(function (err, res) {
        expect(res).to.have.status(200);
        done();
    });
})

