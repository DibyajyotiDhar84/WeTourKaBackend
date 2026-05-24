export function formatedDate(fdate){
    const p = new Date(fdate);
    return `${p.getDate()}-${p.getMonth()+1}-${p.getFullYear()}`;

}