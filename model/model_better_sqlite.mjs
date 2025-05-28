"use strict"

import db from 'better-sqlite3';
import calculate_total_price from './calculate_price.mjs';


const sql = db('model/database.db', {fileMustExist: true});

export let zone_client_info = () => {
    const stmp = sql.prepare('SELECT name, numOfZones, maxPeople FROM ZONETYPE;');
    let zones;
    try {
        zones = stmp.all();
        //console.log(zones);
        return zones;
    } catch (err) {
        throw err;
    }
};

export let check_availability = (checkin, checkout, people, spacenum, spacetype) => {
    const f1 = sql.prepare('SELECT maxPeople, numOfZones FROM ZONETYPE WHERE name = ?;');
    const f2 = sql.prepare(`
        SELECT COUNT(DISTINCT zoneId) AS reserved_zones 
        FROM RESERVATION 
        JOIN RES_ZONE_NUM ON RESERVATION.id = RES_ZONE_NUM.reservationId
        JOIN ZONE ON ZONE.id = RES_ZONE_NUM.zoneId
        WHERE (
            (checkIn <= ? AND checkOut > ?) OR 
            (checkIn >= ? AND checkOut <= ?) OR 
            (checkIn < ? AND checkOut >= ?)
        ) 
        AND zoneType = ?;
    `);
    
    try {
        
        const zoneTypeInfo = f1.get(spacetype);
        if (!zoneTypeInfo) {
            throw new Error(`Zone type ${spacetype} not found`);
        }

        const maxPeople = parseInt(zoneTypeInfo.maxPeople);
        const totalZones = parseInt(zoneTypeInfo.numOfZones);

       
        const result = f2.get(
            checkin, checkin,    
            checkin, checkout,    
            checkout, checkout,   
            spacetype           
        );

        const reservedZones = result ? parseInt(result.reserved_zones) : 0;
        if (isNaN(reservedZones)) {
            throw new Error("Invalid reserved zones count received");
        }

        const availableZones = totalZones - reservedZones;
        const maxPeopleAllowed = maxPeople * spacenum;

        
        if (people > maxPeopleAllowed || spacenum > availableZones) {
            return 0;
        }

        return availableZones;
    } catch (err) {
        console.error("Error in check_availability:", err);
        throw err;
    }
};


export function getAllZones(){
    const zones=sql.prepare("SELECT * FROM ZONETYPE");
    return zones.all();
}
export function getAllReservations(date){
    const reservations=sql.prepare("SELECT R.id,V.firstName,V.lastName,V.email,R.people,R.checkIn,R.checkOut,R.totalPrice,Z.num,Z.zoneType FROM ((RESERVATION AS R JOIN VISITOR AS V ON R.visitorId=V.email) JOIN RES_ZONE_NUM AS RZ ON R.id=RZ.reservationId)JOIN ZONE AS Z ON RZ.zoneId==Z.id WHERE R.checkIn<=? AND R.checkOut>=?");
    return reservations.all(date,date);
}
export function getAllVisitors(){
    const visitorsQ=sql.prepare("SELECT * FROM VISITOR");
    let count=sql.prepare("SELECT COUNT(*) AS totalReservations FROM VISITOR AS V JOIN RESERVATION AS R ON v.email=R.visitorId WHERE v.email=?");
    let visitors=visitorsQ.all();
    for(let i=0;i<visitors.length;i++){
        Object.assign(visitors[i],count.get(visitors[i].email));
    }
    return visitors;
}

export function getSpecificVisitor(id){
    const visitor=sql.prepare("SELECT * FROM VISITOR WHERE email=?")
    return visitor.get(id)
}
export function searchVisitor(name){
    if(name.match("[A-Za-z0-9]+@[A-Za-z0-9]+\\.[A-Za-z0-9]+")===null && name.match("[A-Za-z0-9]+ [A-Za-z0-9]+")===null && name.match("[A-Za-z0-9]+")===null){
        return [{}];
    }
    let searchName=name.split("_");
    let searchEmail=name.split("@");
    let result=[];
    if(searchEmail.length===1){//search by name
        if(searchName.length==2){//name is -> firstName LastName
            let firstName=searchName[0];
            let lastName=searchName[1];
            const visitor=sql.prepare("SELECT * FROM VISITOR WHERE UPPER(firstName) LIKE UPPER(?) AND UPPER(lastName) LIKE UPPER(?)");
            result=visitor.all(firstName,lastName);
        }
        if(searchName.length==1){//name is -> firstName or lastName
            const visitor=sql.prepare("SELECT * FROM VISITOR WHERE UPPER(firstName) LIKE UPPER(?) OR  UPPER(lastName) LIKE UPPER(?)");
            result=visitor.all(name,name);
        }
    }else{//search by email
        let ans=getSpecificVisitor(name);
        if(ans!=undefined)
            result.push(ans);
    }
    return result;
}
export function searchAdminAvailbility(date,zoneType){
    const reserved=sql.prepare("SELECT COUNT(*) AS availability FROM ((RESERVATION AS R JOIN RES_ZONE_NUM AS RZ ON R.id=RZ.reservationId)JOIN ZONE AS Z ON Z.id=RZ.zoneId) WHERE Z.zoneType=? AND R.checkIn<=? AND R.checkOut>=?");
    const max=sql.prepare("SELECT numOfZones FROM ZONETYPE WHERE name=?");
    return max.get(zoneType).numOfZones-reserved.get(zoneType,date,date).availability;
}

export function updateReservation(reservations){
    const zoneIdq=sql.prepare("SELECT Z.id FROM ZONE AS Z WHERE zoneType=? AND num=?");

    for(let i=0;i<reservations.length;i++){
        const inCaseZoneChanged=sql.prepare("SELECT RZ.zoneId FROM (RESERVATION AS R JOIN RES_ZONE_NUM AS RZ ON R.id=reservationId) WHERE ((checkIn <= ? AND checkOut > ?) OR (checkIn >= ? AND checkOut <= ?) OR (checkIn < ? AND checkOut >= ?)) AND R.id!=?").all(reservations[i].checkIn,reservations[i].checkIn,reservations[i].checkIn,reservations[i].checkOut,reservations[i].checkOut,reservations[i].checkOut,reservations[i].id);
        for(let j=0;j<inCaseZoneChanged.length;j++){
            if(zoneIdq.get(reservations[i].zone,reservations[i].zoneNum).id==inCaseZoneChanged[j].zoneId)
                return "err"
        }
    }
    let index={res:0,i:0};
    const zonesQuantity=sql.prepare("SELECT COUNT(*) AS q FROM (RESERVATION AS R JOIN RES_ZONE_NUM AS RZ ON R.id=reservationId) WHERE R.id=?")

    const resUp=sql.prepare("UPDATE RESERVATION SET people=?,checkIn=?,checkOut=? WHERE Id=?");
    const oldZoneId=sql.prepare("SELECT RZ.zoneId FROM RESERVATION AS R JOIN RES_ZONE_NUM AS RZ ON R.id=RZ.reservationId WHERE R.id=?");
    // const reszonenumUp=sql.prepare("UPDATE RES_ZONE_NUM SET zoneId=? WHERE reservationId=?");
    const reszonenumUp=sql.prepare("UPDATE RES_ZONE_NUM SET zoneId=? WHERE reservationId=? AND zoneId=?");
    for(let i=0;i<reservations.length;i++){
        resUp.run(reservations[i].people,reservations[i].checkIn,reservations[i].checkOut,reservations[i].id)//,;
        const costUp=sql.prepare("UPDATE RESERVATION SET totalPrice=? WHERE id=?").run(calculate_total_price(reservations[i].checkIn,reservations[i].checkOut,reservations[i].people,zonesQuantity.get(reservations[i].id).q,reservations[i].zone),reservations[i].id);
        let zoneId=zoneIdq.get(reservations[i].zone,reservations[i].zoneNum);
        // reszonenumUp.run(zoneId.id,reservations[i].id); 

        let oldIdz=oldZoneId.all(reservations[i].id);
        if(oldIdz.length>1 && index.res==reservations[i].id){
            index.i++;
        }else if(index.res!=reservations[i].id){
            index.res=reservations[i].id;
            index.i=0;
        }
        reszonenumUp.run(zoneId.id,reservations[i].id,oldIdz[index.i].zoneId);
    }
}
export function removeReservation(id){
    const delRZ=sql.prepare("DELETE FROM RES_ZONE_NUM WHERE reservationId=?");
    const delRe=sql.prepare("DELETE FROM RESERVATION WHERE id=?");
    delRZ.run(id);
    delRe.run(id);
}
export function editVisitors(visitors){
    const visUp=sql.prepare("UPDATE VISITOR SET email=?,telephone=?,firstName=?,lastName=? WHERE email=?");
    for(let i=0;visitors.length;i++){
        visUp.run(visitors[i].email,visitors[i].telephone,visitors[i].firstName,visitors[i].lastName,visitors[i].ogEmail);
    }
}
export function deleteVisitor(email){
    const deleteYa=sql.prepare("DELETE FROM VISITOR WHERE email=?");
    deleteYa.run(email);
}
export function deleteZoneType(zone){
    const deleteType=sql.prepare("DELETE FROM ZONETYPE WHERE name=?");
    deleteType.run(zone);
}
export function editZoneType(zoneTypes){
    const ztZoneNum=sql.prepare("SELECT numOfZones FROM ZONETYPE WHERE name=?");
    const ztUp=sql.prepare("UPDATE ZONETYPE SET name=?,defaultPeople=?,maxPeople=?,additionalChargePerPerson=?,highSeasonPrice=?,lowSeasonPrice=?,numOfZones=? WHERE name=?");
    for(let i=0;i<zoneTypes.length;i++){
        let prevNum=ztZoneNum.get(zoneTypes[i].name).numOfZones
        let max=prevNum-zoneTypes[i].numOfZones;
        let lastId=sql.prepare("SELECT MAX(id) AS id FROM ZONE").get().id;
        console.log(max);
        if(max<0){//prepei na prosthesoume xorous
            console.log(`prosthese ${abs(max)}`);
            const addZ=sql.prepare("INSERT INTO ZONE VALUES(?,?,?)");
            for(let j=1;j<abs(max)+1;j++){
                addZ.run(lastId+j,zoneTypes[i].name,prevNum+j);
            }
        }else if(max>0){//prepei na afairesoume xorous
            console.log(`afairese ${abs(max)}`);
            const remZ=sql.prepare("DELETE FROM ZONE WHERE num=? AND ZONETYPE=?");
            for(let j=0;j<abs(max);j++){
                remZ.run(prevNum-j,zoneTypes[i].name);
            }
        }
        ztUp.run(zoneTypes[i].name,zoneTypes[i].defaultPeople,zoneTypes[i].maxPeople,zoneTypes[i].additionalChargePerPerson,zoneTypes[i].highSeasonPrice,zoneTypes[i].lowSeasonPrice,zoneTypes[i].numOfZones,zoneTypes[i].ogname);
    }
}
function abs(x){
    return x>0? x:-1*x;
}
export function addZoneType(zone){
    const zIns=sql.prepare("INSERT INTO ZONETYPE VALUES(?,?,?,?,?,?,?)");
    zIns.run(zone.name,zone.defaultPeople,zone.maxPeople,zone.additionalChargePerPerson,zone.highSeasonPrice,zone.lowSeasonPrice,zone.numOfZones);
    const lastZoneId=sql.prepare("SELECT MAX(id) AS lastZoneId FROM ZONE");
    const zoneIns=sql.prepare("INSERT INTO ZONE VALUES(?,?,?)");
    const max=lastZoneId.get().lastZoneId;
    for(let i=1;i<parseInt(zone.numOfZones)+1;i++){
        zoneIns.run(max+i,zone.name,i);
    }
}
export function addVisitor(visitor){
    const addVisitor=sql.prepare("INSERT INTO VISITOR VALUES(?,?,?,?)");
    addVisitor.run(visitor.email,visitor.telephoneNumber,visitor.firstName,visitor.lastName);
}
export function addReservation(reservation){
    let cost=calculate_total_price(reservation.checkIn,reservation.checkOut,reservation.people,reservation.zoneNum,reservation.zoneType);
    console.log(typeof(cost))
    console.log(typeof(cost))
    if(typeof(cost)!="string"){
        const getZones=sql.prepare(`SELECT id FROM ZONE
            WHERE zoneType = ? AND id NOT IN (SELECT DISTINCT zoneId
            FROM RESERVATION
            JOIN RES_ZONE_NUM ON RESERVATION.id = RES_ZONE_NUM.reservationId
            JOIN ZONE ON ZONE.id = RES_ZONE_NUM.zoneId
            WHERE (
                (checkIn <= ? AND checkOut > ?) OR
                (checkIn >= ? AND checkOut <= ?) OR
                (checkIn < ? AND checkOut >= ?)
            ) AND zoneType = ?)
            ORDER BY id LIMIT ?;`).all(reservation.zoneType, reservation.checkIn, reservation.checkIn, reservation.checkIn, reservation.checkOut, reservation.checkOut, reservation.checkOut, reservation.zoneType, reservation.zoneNum);
        const id=sql.prepare("SELECT MAX(id) AS id FROM RESERVATION").get().id;
        const resIns=sql.prepare("INSERT INTO RESERVATION VALUES(?,?,?,?,?,?)").run(id+1,reservation.people,reservation.checkIn,reservation.checkOut,cost,reservation.email);
        const rzIns=sql.prepare("INSERT INTO RES_ZONE_NUM VALUES(?,?)");
        for(let i=0;i<getZones.length;i++){
            rzIns.run(id+1,getZones[i].id);
        }
            return "all good";
    }else{
        return null;
    }
}
export default (check_availability, zone_client_info);

