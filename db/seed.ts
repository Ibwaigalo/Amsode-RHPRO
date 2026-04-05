// db/seed.ts
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import path from "path";

config({ path: path.join(process.cwd(), ".env.local") });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  await db.delete(schema.leaveRequests);
  await db.delete(schema.jobPostings);
  await db.delete(schema.employees);
  await db.delete(schema.positions);
  await db.delete(schema.departments);
  await db.delete(schema.users);

  const [directionDept, rhDept, financeDept, terrainDept, commDept] = await db
    .insert(schema.departments)
    .values([
      { name: "Direction Générale", code: "DG" },
      { name: "Ressources Humaines", code: "RH" },
      { name: "Finance & Comptabilité", code: "FIN" },
      { name: "Programmes Terrain", code: "TERRAIN" },
      { name: "Communication", code: "COMM" },
    ])
    .returning();

  console.log("✅ Departments créés");

  const [dgPos, rhPos, cptPos, terrain1Pos, commPos] = await db
    .insert(schema.positions)
    .values([
      { title: "Directeur Général", departmentId: directionDept.id, level: "5", minSalary: "800000", maxSalary: "1500000" },
      { title: "Responsable RH", departmentId: rhDept.id, level: "4", minSalary: "400000", maxSalary: "700000" },
      { title: "Comptable Principal", departmentId: financeDept.id, level: "3", minSalary: "300000", maxSalary: "500000" },
      { title: "Chargé de Programme", departmentId: terrainDept.id, level: "3", minSalary: "280000", maxSalary: "450000" },
      { title: "Chargé de Communication", departmentId: commDept.id, level: "3", minSalary: "250000", maxSalary: "400000" },
    ])
    .returning();

  console.log("✅ Postes créés");

  const adminPassword = await bcrypt.hash("Admin@2024", 12);
  const [adminUser] = await db
    .insert(schema.users)
    .values({
      name: "Administrateur RH",
      email: "admin@amsode.ml",
      password: adminPassword,
      role: "ADMIN_RH",
      isActive: true,
    })
    .returning();

  const employeesData = [
    { employeeNumber: "AMS-24-0001", firstName: "Mamadou", lastName: "Coulibaly", workEmail: "m.coulibaly@amsode.ml", phone: "+223 76 12 34 56", cin: "ML-2024-001", dateOfBirth: "1975-03-15", gender: "M", contractType: "CDI", startDate: "2020-01-15", positionId: dgPos.id, departmentId: directionDept.id, baseSalary: "950000", zone: "Bamako" },
    { employeeNumber: "AMS-24-0002", firstName: "Aminata", lastName: "Traoré", workEmail: "a.traore@amsode.ml", phone: "+223 66 23 45 67", cin: "ML-2024-002", dateOfBirth: "1985-07-22", gender: "F", contractType: "CDI", startDate: "2021-03-01", positionId: rhPos.id, departmentId: rhDept.id, baseSalary: "520000", zone: "Bamako" },
    { employeeNumber: "AMS-24-0003", firstName: "Ibrahim", lastName: "Diallo", workEmail: "i.diallo@amsode.ml", phone: "+223 79 34 56 78", cin: "ML-2024-003", dateOfBirth: "1988-11-10", gender: "M", contractType: "CDI", startDate: "2019-06-15", positionId: cptPos.id, departmentId: financeDept.id, baseSalary: "380000", zone: "Bamako" },
    { employeeNumber: "AMS-24-0004", firstName: "Fatoumata", lastName: "Sanogo", workEmail: "f.sanogo@amsode.ml", phone: "+223 65 45 67 89", cin: "ML-2024-004", dateOfBirth: "1990-04-25", gender: "F", contractType: "CDI", startDate: "2022-01-10", positionId: terrain1Pos.id, departmentId: terrainDept.id, baseSalary: "320000", zone: "Kayes" },
    { employeeNumber: "AMS-24-0005", firstName: "Seydou", lastName: "Konaté", workEmail: "s.konate@amsode.ml", phone: "+223 70 56 78 90", cin: "ML-2024-005", dateOfBirth: "1992-09-18", gender: "M", contractType: "CDI", startDate: "2021-09-01", positionId: terrain1Pos.id, departmentId: terrainDept.id, baseSalary: "310000", zone: "Sikasso" },
    { employeeNumber: "AMS-24-0006", firstName: "Mariam", lastName: "Coulibaly", workEmail: "mar.coulibaly@amsode.ml", phone: "+223 91 67 89 01", cin: "ML-2024-006", dateOfBirth: "1993-02-14", gender: "F", contractType: "CDD", startDate: "2024-01-15", endDate: "2024-12-31", positionId: commPos.id, departmentId: commDept.id, baseSalary: "270000", zone: "Bamako" },
    { employeeNumber: "AMS-24-0007", firstName: "Oumar", lastName: "Sidibé", workEmail: "o.sidibe@amsode.ml", phone: "+223 72 78 90 12", cin: "ML-2024-007", dateOfBirth: "1987-06-30", gender: "M", contractType: "CDI", startDate: "2018-11-01", positionId: terrain1Pos.id, departmentId: terrainDept.id, baseSalary: "350000", zone: "Mopti" },
    { employeeNumber: "AMS-24-0008", firstName: "Kadiatou", lastName: "Diarra", workEmail: "k.diarra@amsode.ml", phone: "+223 88 89 01 23", cin: "ML-2024-008", dateOfBirth: "1995-12-05", gender: "F", contractType: "STAGE", startDate: "2024-07-01", endDate: "2024-12-31", positionId: rhPos.id, departmentId: rhDept.id, baseSalary: "150000", zone: "Bamako" },
    { employeeNumber: "AMS-24-0009", firstName: "Boubacar", lastName: "Keïta", workEmail: "b.keita@amsode.ml", phone: "+223 73 90 12 34", cin: "ML-2024-009", dateOfBirth: "1983-08-20", gender: "M", contractType: "CDI", startDate: "2017-04-15", positionId: cptPos.id, departmentId: financeDept.id, baseSalary: "420000", zone: "Bamako" },
    { employeeNumber: "AMS-24-0010", firstName: "Rokiatou", lastName: "Bah", workEmail: "r.bah@amsode.ml", phone: "+223 77 01 23 45", cin: "ML-2024-010", dateOfBirth: "1991-01-08", gender: "F", contractType: "CDI", startDate: "2023-03-01", positionId: terrain1Pos.id, departmentId: terrainDept.id, baseSalary: "295000", zone: "Timbuktu" },
  ];

  const createdEmployees = await db.insert(schema.employees).values(employeesData).returning();
  console.log(`✅ ${createdEmployees.length} employés créés`);

  await db.update(schema.users).set({ employeeId: createdEmployees[1].id }).where(eq(schema.users.id, adminUser.id));

  await db.insert(schema.leaveRequests).values([
    { employeeId: createdEmployees[2].id, leaveType: "CONGE_PAYE", startDate: "2024-09-02", endDate: "2024-09-13", daysCount: 10, reason: "Congés annuels planifiés", status: "APPROUVE" },
    { employeeId: createdEmployees[3].id, leaveType: "MALADIE", startDate: "2024-08-19", endDate: "2024-08-21", daysCount: 3, reason: "Maladie avec certificat médical", status: "APPROUVE" },
    { employeeId: createdEmployees[4].id, leaveType: "CONGE_PAYE", startDate: "2024-09-16", endDate: "2024-09-20", daysCount: 5, reason: "Déplacement familial", status: "EN_ATTENTE" },
  ]);

  await db.insert(schema.jobPostings).values({
    title: "Chargé de projet WASH",
    departmentId: terrainDept.id,
    description: "Nous recherchons un chargé de projet expérimenté pour coordonner nos activités WASH en zone rurale au Mali.",
    requirements: "Bac+4 minimum en Eau & Assainissement ou domaine similaire. 3 ans d'expérience en ONG.",
    contractType: "CDI",
    location: "Bamako (déplacements terrain)",
    deadline: "2024-10-31",
    status: "OUVERT",
    createdBy: adminUser.id,
  });

  console.log("✅ Données de démonstration créées");
  console.log("\n🎉 Seed terminé avec succès !");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin : admin@amsode.ml / Admin@2024");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Erreur seed:", err);
  process.exit(1);
});
