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
        console.log("admin table creation error: " + err);
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
        console.log("kontrol table creation error: " + err);
    }
}

async function create_one_row_kontrol(id, code)
{
    try {

        const [ret] = await db.execute("select * from kontrol");
        if(ret.length > 0)
        {
            return;
        }

        await db.execute(`INSERT INTO kontrol (idkontrol, emailCode) VALUES (?, ?)`, [id, code]);
        console.log("default kontrol creation");
    } catch (error) {
        console.log("Error inserting row into kontrol table: " + error);
    }
}


async function create_kullanicilar_table()
{
    try{
        await db.execute(`CREATE TABLE IF NOT EXISTS kullanıcılar (
            idkullanıcılar int NOT NULL AUTO_INCREMENT,
            KullanıcıAdı varchar(50) NOT NULL,
            sifre varchar(255) NOT NULL,
            email varchar(255) NOT NULL,
            cinsiyet varchar(20) NOT NULL,
            konum varchar(255) NOT NULL,
            isim varchar(255) NOT NULL,
            soyisim varchar(255) NOT NULL,
            dogumTarihi date NOT NULL,
            telefon varchar(10) NOT NULL,
            photoPath varchar(1000) DEFAULT NULL,
            PRIMARY KEY (idkullanıcılar),
            UNIQUE KEY idkullanıcılar_UNIQUE (idkullanıcılar),
            UNIQUE KEY KullanıcıAdı_UNIQUE (KullanıcıAdı)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`);
          console.log("kullanicilar table is created!");
    }
    catch(err)
    {
        console.log("kullanicilar table creation error: " + err);
    }
}

async function create_ilgi_alanlari_table()
{
    try{
        await db.execute(`CREATE TABLE IF NOT EXISTS ilgialanlari (
            idilgiAlanlari int NOT NULL AUTO_INCREMENT,
            ilgiAlani varchar(255) NOT NULL,
            PRIMARY KEY (idilgiAlanlari),
            UNIQUE KEY idilgiAlanlari_UNIQUE (idilgiAlanlari)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`);
          console.log("ilgi alanlari table is created!");
    }
    catch(err)
    {
        console.log("ilgi alanlari table creation error: " + err);
    }
}

async function create_ilgi_alani(name)
{
    try {

        const [ret] = await db.execute("select * from ilgialanlari where ilgiAlani = ?", [name]);
        if(ret.length > 0)
        {
            return;
        }

        await db.execute(`INSERT INTO ilgialanlari (ilgiAlani) VALUES (?)`, [name]);
        //console.log("ilgialanlari creation");
    } catch (error) {
        console.log("Error inserting row into ilgialanlari table: " + error);
    }
}

async function create_kullanici_ilgileri_table()
{
    try{
        await db.execute(`CREATE TABLE IF NOT EXISTS kullanici_ilgileri (
            idkullanici_ilgileri int NOT NULL AUTO_INCREMENT,
            idkullaniciR INT NOT NULL,
            idilgiR INT NOT NULL,
            PRIMARY KEY (idkullanici_ilgileri),
            KEY idkullaniciR_idx (idkullaniciR),
            KEY idilgiR_idx (idilgiR),
            CONSTRAINT fk_kullanici FOREIGN KEY (idkullaniciR) REFERENCES kullanıcılar (idkullanıcılar) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_ilgiAlanlari FOREIGN KEY (idilgiR) REFERENCES ilgialanlari (idilgiAlanlari) ON DELETE CASCADE ON UPDATE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`);
          console.log("kullanici ilgileri table is created!");
    }
    catch(err)
    {
        console.log("kullanici ilgileri table creation error: " + err);
    }
}






//tables
create_admin_table();
create_kontrol_table();
create_kullanicilar_table();
create_ilgi_alanlari_table();
create_kullanici_ilgileri_table();


//one control row
create_one_row_kontrol(1, 123456);


//ilgi alanlari
create_ilgi_alani("Spor");
create_ilgi_alani("Müzik");
create_ilgi_alani("Sinema");
create_ilgi_alani("Kitap");

