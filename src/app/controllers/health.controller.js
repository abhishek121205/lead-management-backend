export const healthCheck = async (req, res) => {
    try {
        return res.status(200).json({
            status: 1,
            message: "Server is alive",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: "Server error",
            error: error.message
        });
    }
};