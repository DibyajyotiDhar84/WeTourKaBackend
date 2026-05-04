export class ApiResponse{
    constructor(statusCode,msg,data=null,success=false){
        this.statusCode=statusCode;
        this.data=data;
        this.msg=msg;
        this.success=success;

    }
}