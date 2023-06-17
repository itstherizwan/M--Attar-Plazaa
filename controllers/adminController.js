import { Product } from "../models/itemModel.js";
import { Order } from "../models/orderModel.js";
import { User } from "../models/userModel.js";
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import moment from 'moment';
import { sendReport } from "../utils/sendMail.js";

export const getAdminStats = async (req, res, next) => {
    try {
        const usersCount = await User.countDocuments();

        const placedOrdersCount = await Order.countDocuments({ orderStatus: "Placed" });
        const dispatchedOrdersCount = await Order.countDocuments({ orderStatus: "Dispatched" });
        const shippedOrdersCount = await Order.countDocuments({ orderStatus: "Shipped" });
        const inTransitOrdersCount = await Order.countDocuments({ orderStatus: "In Transit" });
        const deliveredOrdersCount = await Order.countDocuments({ orderStatus: "Delivered" });

        const aggregationResult = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalIncome: { $sum: "$totalAmount" },
                },
            },
        ]);

        const totalIncome = aggregationResult.length > 0 ? aggregationResult[0].totalIncome : 0;

        res.status(200).json({
            success: true,
            usersCount,
            ordersCount: {
                total: preparingOrdersCount + dispatchedOrdersCount + shippedOrdersCount + inTransitOrdersCount + deliveredOrdersCount,
                placed: placedOrdersCount,
                dispatched: dispatchedOrdersCount,
                shipped: shippedOrdersCount,
                inTransit: inTransitOrdersCount,
                delivered: deliveredOrdersCount,
            },
            totalIncome,
        });
    } catch (error) {
        console.error("Error retrieving admin statistics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve admin statistics",
            error: error.message,
        });
    }
};

export const getAdminProducts = async (req, res, next) => {

    try {
        const { search } = req.query;

        let query = {};

        if (search) {
            const regex = new RegExp(search, 'i');

            if (mongoose.Types.ObjectId.isValid(search)) {
                // Search by exact product ID value
                query = { _id: search };
            } else if (!isNaN(search)) {
                // Search by exact price value
                query = { price: parseFloat(search) };
            } else {
                // Search by name or category using regex
                query = {
                    $or: [
                        { name: regex },
                        { category: regex },
                    ],
                };
            }
        }

        const products = await Product.find(query);
        const productsCount = products.length;

        res.status(200).json({
            success: true,
            products,
            productsCount,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



export const generateExcelReport = async (req, res) => {
    try {
        const twelveHoursAgo = moment().subtract(12, 'hours');
        const users = await User.find({ createdAt: { $gte: twelveHoursAgo } });
        const adminEmail = req.user.email;
        const userIds = users.map(user => user._id);
        const ordersCount = await Order.aggregate([
            {
                $match: {
                    user: { $in: userIds }
                }
            },
            {
                $group: {
                    _id: "$user",
                    count: { $sum: 1 }
                }
            }
        ]);
        const orders = await Order.find({ user: { $in: userIds } });
        const orderIdsMap = {};
        orders.forEach(order => {
            if (orderIdsMap[order.user]) {
                orderIdsMap[order.user].push(order._id.toString());
            } else {
                orderIdsMap[order.user] = [order._id.toString()];
            }
        });
        // const ordersMap = {};
        // ordersCount.forEach(order => {
        //     ordersMap[order._id.toString()] = order.count;
        // });
        // Create a new Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        // Add headers to the worksheet
        worksheet.columns = [
            { header: 'User ID', key: 'userId' },
            { header: 'Username', key: 'username' },
            { header: 'Email', key: 'email' },
            { header: 'Orders Placed', key: 'ordersPlaced' },
            { header: 'Order IDs', key: 'orderIds' }
        ];

        // Add data rows to the worksheet
        // Add data rows to the worksheet
        users.forEach(user => {
            const orderIds = orderIdsMap[user._id.toString()] || [];
            const row = worksheet.addRow({
                userId: user._id,
                username: user.name,
                email: user.email,
                ordersPlaced: orderIds.length,
                orderIds: orderIds.join(', ')
            });
        });


        // Generate the Excel file
        const reportBuffer = await workbook.xlsx.writeBuffer();

        // Send the Excel file as an email attachment
        const emailContent = 'Please find attached the Excel report.';
        await sendReport(adminEmail, 'Excel Report', emailContent, 'Report.xlsx', reportBuffer);

        res.status(200).json({ success: true, message: 'Excel report sent successfully' });
    } catch (error) {
        console.error('Error generating Excel report:', error);
        res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
};

export const getAdminUsers = async (req, res, next) => {
    const users = await User.find({});
    res.status(200).json({
      success: true,
      users,
    });
  };






