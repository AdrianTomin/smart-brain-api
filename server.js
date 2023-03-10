import express from 'express';
import bcrypt from 'bcrypt-nodejs'
import cors from 'cors'
import knex from 'knex'

const db = knex({
    client: 'pg',
    connection: {
        host: 'dpg-cg44vqvdvk4st7163sd0-a.oregon-postgres.render.com', //127.0.0.1: same as local host
        user: 'admin',
        password: 'pa5kra52lI1DwpIrzhMDeEuE4notRUWW',
        database: 'smart_brain_snow'
    }
});

// db.select('*').from('users')
// .then(data =>{
//     console.log(data);
// })


const app = express();
app.use(express.json());
app.use(cors())

app.get('/', (req, res) => {
    res.send('Success')
})

app.post('/signin', (req, res) => {
    // // Load hash from your password DB
    // bcrypt.compare('apples', "$2a$10$Bo3tQicurljJA8OY8DH.K.yvGy6i777nf6nbyxVfCC/b1uQCyfR92", function(err, res) {
    // // res === true
    // console.log(1, "guess", res);
    // })
    // bcrypt.compare('veggies', "$2a$10$Bo3tQicurljJA8OY8DH.K.yvGy6i777nf6nbyxVfCC/b1uQCyfR92", function(err, res) {
    // // res === false
    //     console.log(2, "guess", res);
    // })
    // .insert({
    //     // If you are using Knex.js version 1.0.0 or higher this 
    //     // now returns an array of objects. Therefore, the code goes from:
    //     // loginEmail[0] --> this used to return the email
    //     // TO
    //     // loginEmail[0].email --> this now returns the email
    //     email: loginEmail[0].email, // <-- this is the only change!
    //     name: name,
    //     joined: new Date()
    // })
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json('incorrect form submission')
    }
    db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if (isValid) {
            return db.select('*')
            .from('users')
            .where('email', '=', email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        } else {
            res.status(400).json('Wrong Credentials')
        }
    })
    .catch(err => res.status(400).json('Wrong credentials'))
})

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
        return res.status(400).json('incorrect form submission')
    }
    const hash = bcrypt.hashSync(password)
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(async loginEmail => {
            const user = await trx('users')
                .returning('*')
                .insert({
                    email: loginEmail[0].email,
                    name: name,
                    joined: new Date()
                });
            res.json(user[0]);
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('Unable to Register.'))
})

//app.use(express.urlencoded({ extended: false }));
// app.use(express.json());


app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where({
        id: id // can be written as just id with ES6 .where({id})
    })
    .then(user => {
        if (user.length) {
            res.json(user[0]);
        } else {
            res.status(400).json('Not Found')
        }
    })
    .catch(err => res.status(400).json('Error getting user'))
} )

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0].entries);
    })
    .catch(err => res.status(400).json('Unable to Get Entries'))

    // .then(entries => {
    // // If you are using knex.js version 1.0.0 or higher this now 
    // // returns an array of objects. Therefore, the code goes from:
    // // entries[0] --> this used to return the entries
    // // TO
    // // entries[0].entries --> this now returns the entries
    // res.json(entries[0].entries);
// })
})

app.post('/api-data', (req, res) => {
    const REACT_APP_PAT = "db53c70a285a4bdc921b3271456fde47";
    const REACT_APP_USER_ID = "adrian_tomin69";
    res.send({ pat: REACT_APP_PAT, userID: REACT_APP_USER_ID });
})
app.listen(3000, () => {
})

/*
/ -> this is working
/signin -> POST = success/fail //don't want to send password as a query string, want to send in the body through an http request and hide it from MIM attacks
/register -> POST = user
/profile/:userID -> GET = user
/image -> PUT = user
*/

// res.json('signin') // better than send
