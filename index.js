import * as data from './data.js';
import express from 'express';
import { Poses } from "./models/Poses.js";
import cors from 'cors';


const app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.static('./public')); // set location for static files
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/api', cors()); // set Access-Control-Allow-Origin header for api route

app.set("view engine", "ejs");

// uses api
app.get('/api/poses', (req,res, next) => {
    Poses.find({}).lean()
        .then((poses) => {
            if (poses) {
                res.json(poses);
            } else {
                return res.status(500).send('Database Error occurred');
            }
        })
});

// uses api
app.get('/api/detail/:name', (req, res, next) => {
    Poses.findOne({ name: req.params.name })
        .then((pose) => {
            console.log(pose);
            if (pose !== null) {
                res.json(pose);
            } else {
                return res.status(400).send(req.params.name + ' not found');
            }
        })
        .catch(err => next(err))
});
//uses api's

// this one checks return
app.delete('/api/delete/:name', (req, res, next) => {
    let name = req.params.name;
    Poses.deleteOne({name: name}, (err, result) => {
        if (result.deletedCount === 0) {
            res.status(500).json({"message": "was not deleted"});
        } else {
            res.status(200).json({"message": `${name} was removed`});
        }
    });
});


app.get('/api/pose/delete/:id', (req,res, next) => {
    Poses.deleteOne({"_id":req.params.id }, (err, result) => {
        if (err) return next(err);
        // return # of items deleted
        res.json({"deleted": result});
    });
});

// old one
app.delete('/api/deleteOld/:name', (req, res, next) => {
    Poses.deleteOne({ name: req.params.name })
        .then((pose) => {
            console.log(pose + "delete");
            if (pose !== null) {
                res.json(pose);
            } else {
                return res.status(400).send(req.params.name + ' not found');
            }
        })
        .catch(err => next(err))
});


// works! make sure to use JSON in postman
app.post("/api/add/", (req,res,next) => {
    const newPose = {"name":req.body.name, "benefit": req.body.benefit, "ability": req.body.ability, "symbol": req.body.symbol}
    Poses.updateOne({"name": req.body.name}, newPose, {upsert:true}, (err, result) => {
        // if (err) return next(err);
        if (err || !name){
            res.status(404).json({"Error": "Pose was not added"});
      } else {
            res.json({"message": "pose was added"})
        }
    });
});

// used in home_react.ejs
app.post('/api/pose/add/', (req,res, next) => {
    // find & update existing item, or add new
    console.log(req.body)
    if (!req.body._id) { // insert new document

        let pose = new Poses({name:req.body.name,benefit:req.body.benefit,ability:req.body.ability, symbol: req.body.symbol });
        pose.save((err,newPose) => {
            if (err) return next(err);
            console.log("Here123" + newPose)
            res.json({updated: 0, _id: newPose._id});
        });
    } else { // update existing document
        Poses.updateOne({ _id: req.body._id}, {name:req.body.name, benefit: req.body.benefit,ability:req.body.ability, symbol: req.body.symbol }, (err, result) => {
            if (err) return next(err);
            res.json({updated: result.nModified, _id: req.body._id});
        });
    }
});



app.post('/api/v1/add/', (req,res, next) => {
    // find & update existing item, or add new
    console.log(req.body)
    if (!req.body._id) { // insert new document

        let book = new Book({title:req.body.title,author:req.body.author,pubdate:req.body.pubdate});
        book.save((err,newBook) => {
            if (err) return next(err);
            console.log(newBook)
            res.json({updated: 0, _id: newBook._id});
        });
    } else { // update existing document
        Book.updateOne({ _id: req.body._id}, {title:req.body.title, author: req.body.author, pubdate: req.body.pubdate }, (err, result) => {
            if (err) return next(err);
            res.json({updated: result.nModified, _id: req.body._id});
        });
    }
});

// this one works updates and adds
// api
app.post("/api/add1", (req,res,next) => {
    const newPose = {"name":"Tree", "benefit":"Stability", "ability": "Easy123", "symbol": "Grounding"}
    Poses.updateOne({"name":"Tree"}, newPose, {upsert:true}, (err, result) => {
        if (err) return next(err);
        console.log(result);
        res.json({"message": "pose was added"})
    });
});

// regular page - pre-react
// app.get('/', (req, res, next) => {
//     Poses.find({}).lean()
//         .then((poses) => {
//             // respond to browser only after db query completes
//             res.render('home', {poses});
//         })
//         .catch(err => next(err))
// });

// this one works, before update above
// app.post("/api/add", (req,res,next) => {
//     const newPose = {"name":req.body.name, "benefit": req.body.benefit, "ability": req.body.ability, "symbol": req.body.symbol}
//     Poses.updateOne({"name": req.body.name}, newPose, {upsert:true}, (err, result) => {
//         if (err) return next(err);
//         console.log(result);
//         res.json({"message": "pose was added"})
//     });
// });

// react!
app.get('/', (req, res, next) => {
    Poses.find({}).lean()
        .then((poses) => {
            // respond to browser only after db query completes
            // res.render('home', {poses});
            res.render('home_react', { poses: JSON.stringify(poses) });
        })
        .catch(err => next(err))
});

//reg - pre-react
app.get('/detail', (req,res,next) => {
    // db query can use request parameters
    Poses.findOne({ name: req.query.name }).lean()
        .then((pose) => {
            res.render('detail', {result: pose} );
        })
        .catch(err => next(err));
});
// regular - pre-react
app.get('/delete', (req,res,next) => {
    let poseName = req.query.name
    Poses.deleteOne({ name: req.query.name }).lean()
        .then(() => {
            res.send(req.query.name + " has been deleted");
        })
        .catch(err => next(err));

});

// send plain text response - pre-react
app.get('/about', (req,res) => {
    res.type('text/plain');
    res.send('About page');
});

// define 404 handler
app.use((req,res) => {
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not found');
});

app.listen(app.get('port'), () => {
    console.log('Express started');
});

