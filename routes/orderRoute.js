
import express from "express";
import { SearchOrder, dailyCount, getMyOrders, getOrderDetails, getSingleOrder, placeOrder, placeOrderOnline, processOrder } from "../controllers/orderController.js";
import { isAdminOrVendor, isAuthenticated } from "../middleware/auth.js";

const router = express.Router();


router.post("/place-order", isAuthenticated, placeOrder);

router.post("/place-online-order", isAuthenticated, placeOrderOnline);

router.route("/order/:id").get(isAuthenticated, isAdminOrVendor, getSingleOrder);

router.get('/myorders', isAuthenticated, getMyOrders);

router.get('/myorder/:id', isAuthenticated, getOrderDetails);

router.get('/processing-order/:id', isAuthenticated, isAdminOrVendor, processOrder);

router.get('/daily-count', isAuthenticated, isAdminOrVendor, dailyCount); // daliy order count 

router.get('/seach-order', isAuthenticated, isAdminOrVendor, SearchOrder); //search order for vendor





export default router;
