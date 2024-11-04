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

create_admin_table();