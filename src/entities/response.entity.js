export class Message{
    constructor(msg,res=null,success=false){
        this.res=res;
        this.msg=msg;
        this.success=success;

    }
}