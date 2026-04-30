-- Set all existing users' passwords to: Test@1234
UPDATE users 
SET password_hash = '$2a$10$R0tLYn4Ca1ojagqrz4Y3JuXL6ksYm5alK.Ea3Tu4gvK9O.7jefj/.'
WHERE email IN ('admin@alpha.com', 'admin@testcorp.com');

SELECT email, LEFT(password_hash, 30) as hash_preview FROM users;
