const bcrypt = require('bcryptjs');
const { poolPromise, sql } = require('./db');

async function seed() {
    try {
        const pool = await poolPromise;
        if (!pool) {
            console.error('Database connection failed');
            return;
        }

        console.log('Seeding initial admin user...');
        
        const passwordHash = await bcrypt.hash('admin123', 10);

        // Check if admin already exists
        const checkResult = await pool.request()
            .query("SELECT * FROM sec.AppUser WHERE LoginName = 'admin'");
            
        if (checkResult.recordset.length > 0) {
            console.log('Admin user already exists');
        } else {
            // Insert user
            const result = await pool.request()
                .input('loginName', sql.NVarChar, 'admin')
                .input('displayName', sql.NVarChar, 'System Administrator')
                .input('passwordHash', sql.NVarChar, passwordHash)
                .query(`
                    INSERT INTO sec.AppUser (LoginName, DisplayName, PasswordHash, PasswordAlgorithm, IsActive)
                    OUTPUT INSERTED.AppUserId
                    VALUES (@loginName, @displayName, @passwordHash, 'BCRYPT', 1)
                `);
                
            const userId = result.recordset[0].AppUserId;
            
            // Assign CFO/Admin Role (create role if missing)
            const roleResult = await pool.request()
                .query("SELECT SecurityRoleId FROM sec.SecurityRole WHERE RoleCode = 'CFO'");
                
            let roleId;
            if (roleResult.recordset.length > 0) {
                roleId = roleResult.recordset[0].SecurityRoleId;
            } else {
                const newRole = await pool.request()
                    .query("INSERT INTO sec.SecurityRole (RoleCode, RoleName, IsFinancialApprover) OUTPUT INSERTED.SecurityRoleId VALUES ('CFO', 'Chief Financial Officer', 1)");
                roleId = newRole.recordset[0].SecurityRoleId;
            }
            
            await pool.request()
                .input('userId', sql.BigInt, userId)
                .input('roleId', sql.Int, roleId)
                .query("INSERT INTO sec.UserRole (AppUserId, SecurityRoleId) VALUES (@userId, @roleId)");

            console.log('Admin user seeded successfully. Username: admin, Password: admin123');
        }
        
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        process.exit();
    }
}

seed();
