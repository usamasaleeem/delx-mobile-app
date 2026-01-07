require('dotenv').config()

const mongoose = require('mongoose');


const dbConnect=async()=>{
    try {
        const connection = await mongoose.connect(process.env.MONGO_URL)
        console.log('connected to db...')
    } catch (error) {
        console.log('failed to connect to db')
        console.error(error)
    }


}


module.exports =  dbConnect;