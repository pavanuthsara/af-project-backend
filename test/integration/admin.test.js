const supertest = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const connectToDatabase = require('../../src/infrastructure/database/mongoose');
const UserSchema = require('../../src/interface_adapters/schemas/UserSchema');
const TruckSchema = require('../../src/interface_adapters/schemas/TruckSchema');
const DriverSchema = require('../../src/interface_adapters/schemas/DriverSchema');
const PasswordService = require('../../src/infrastructure/security/PasswordService');
const JwtService = require('../../src/infrastructure/security/JwtService');
const server = require('../../src/infrastructure/webserver/server');

const app = express();
app.use(express.json());

// Mock server for testing
const testServer = express();
testServer.use(express.json());
const SignUpController = require('../../src/interface_adapters/controllers/SignUpController');
const LoginController = require('../../src/interface_adapters/controllers/LoginController');
const AdminLoginController = require('../../src/interface_adapters/controllers/AdminLoginController');
const RegisterAdminController = require('../../src/interface_adapters/controllers/RegisterAdminController');
const RegisterTruckController = require('../../src/interface_adapters/controllers/RegisterTruckController');
const RegisterDriverController = require('../../src/interface_adapters/controllers/RegisterDriverController');
const AssignDriverToTruckController = require('../../src/interface_adapters/controllers/AssignDriverToTruckController');
const adminAuthMiddleware = require('../../src/interface_adapters/middleware/AdminAuthMiddleware');

const signUpController = new SignUpController();
const loginController = new LoginController();
const adminLoginController = new AdminLoginController();
const registerAdminController = new RegisterAdminController();
const registerTruckController = new RegisterTruckController();
const registerDriverController = new RegisterDriverController();
const assignDriverToTruckController = new AssignDriverToTruckController();

testServer.post('/signup', (req, res) => signUpController.handle(req, res));
testServer.post('/login', (req, res) => loginController.handle(req, res));
testServer.post('/admin/login', (req, res) => adminLoginController.handle(req, res));
testServer.post('/admin/register', adminAuthMiddleware, (req, res) => registerAdminController.handle(req, res));
testServer.post('/admin/trucks', adminAuthMiddleware, (req, res) => registerTruckController.handle(req, res));
testServer.post('/admin/drivers', adminAuthMiddleware, (req, res) => registerDriverController.handle(req, res));
testServer.post('/admin/trucks/assign-driver', adminAuthMiddleware, (req, res) => assignDriverToTruckController.handle(req, res));


describe('Admin Endpoints', () => {
    let adminToken;
    let adminUser;

    beforeAll(async () => {
        await connectToDatabase();
        const passwordService = new PasswordService();
        const hashedPassword = await passwordService.hash('password123');
        adminUser = new UserSchema({
            name: 'Admin User',
            email: 'admin@test.com',
            password: hashedPassword,
            role: 'admin'
        });
        await adminUser.save();

        const jwtService = new JwtService();
        adminToken = jwtService.generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
    });

    afterAll(async () => {
        await UserSchema.deleteMany({});
        await TruckSchema.deleteMany({});
        await DriverSchema.deleteMany({});
        await mongoose.connection.close();
    });

    describe('POST /admin/trucks', () => {
        it('should register a new truck', async () => {
            const res = await supertest(testServer)
                .post('/admin/trucks')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    make: 'Volvo',
                    model: 'VNL',
                    year: 2022,
                    licensePlate: 'TRUCK123'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toBe('Truck registered successfully');
            expect(res.body.truck.licensePlate).toBe('TRUCK123');
        });
    });

    describe('POST /admin/drivers', () => {
        it('should register a new driver', async () => {
            const res = await supertest(testServer)
                .post('/admin/drivers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'John Doe',
                    licenseNumber: 'DRIVER123'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toBe('Driver registered successfully');
            expect(res.body.driver.licenseNumber).toBe('DRIVER123');
        });
    });

    describe('POST /admin/trucks/assign-driver', () => {
        it('should assign a driver to a truck', async () => {
            const truck = new TruckSchema({
                make: 'Scania',
                model: 'S-Series',
                year: 2023,
                licensePlate: 'TRUCK456'
            });
            await truck.save();

            const driver = new DriverSchema({
                name: 'Jane Doe',
                licenseNumber: 'DRIVER456'
            });
            await driver.save();

            const res = await supertest(testServer)
                .post('/admin/trucks/assign-driver')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    truckId: truck.id,
                    driverId: driver.id
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Driver assigned to truck successfully');
            expect(res.body.truck.driverId.toString()).toBe(driver.id.toString());
        });
    });
});
