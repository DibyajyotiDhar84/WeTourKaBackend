import app from "./app.js";
import connectDb from "./db/conn.js";
import env from 'dotenv'
env.config();

connectDb().then(()=>{

    app.listen(parseInt(process.env.PORT),()=>{
        console.log("listing in ",process.env.PORT);
        
    })
}).catch(err=>{
    console.log(err);
    
})