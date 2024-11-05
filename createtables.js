const db = require("./data/db");

async function create_admin_table()
{
    try{
        await db.execute(`CREATE TABLE IF NOT EXISTS admin (
            idadmin int NOT NULL AUTO_INCREMENT,
            kullaniciAdi varchar(255) NOT NULL,
            sifre varchar(255) NOT NULL,
            PRIMARY KEY (idadmin),
            UNIQUE KEY idadmin_UNIQUE (idadmin),
            UNIQUE KEY kullaniciAdi_UNIQUE (kullaniciAdi)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`);
          console.log("admin table is created!");
    }
    catch(err)
    {
        console.log("admin table creation error: " + error);
    }
}


async function create_kontrol_table()
{
    try{
        await db.execute(`CREATE TABLE IF NOT EXISTS kontrol (
            idkontrol int NOT NULL,
            emailCode int NOT NULL,
            PRIMARY KEY (idkontrol)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);
          console.log("kontrol table is created!");
    }
    catch(err)
    {
        console.log("kontrol table creation error: " + error);
    }
}

async function create_one_row_kontrol()
{
    try {

        const [ret] = await db.execute("select * from kontrol");
        if(ret.length > 0)
        {
            return;
        }

        await db.execute(`INSERT INTO kontrol (idkontrol, emailCode) VALUES (?, ?)`, [1, 123456]);
        console.log("default kontrol creation");
    } catch (error) {
        console.log("Error inserting row into kontrol table: " + error);
    }
}



create_admin_table();
create_kontrol_table();
create_one_row_kontrol();