import { expressConfig } from "./src/configs/express.config.js";
import { dbConnection } from "./src/configs/dbconnection.config.js";

const app = expressConfig();

dbConnection().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
