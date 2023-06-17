import { Product } from "../models/itemModel.js";
import { Order } from "../models/orderModel.js";
import { User } from "../models/userModel.js";
import { instance } from "../server.js";
import { sendMail } from "../utils/sendMail.js";
import { validationResult } from "express-validator";

export const placeOrder = async (req, res, next) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingCharges,
      totalAmount,
    } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order items",
      });
    }

    for (const item of orderItems) {
      if (!item.name || !item.price || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: "Invalid order item: name, price, and quantity are required",
        });
      }
    }

    const orderOptions = {
      shippingInfo,
      orderItems,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingCharges,
      totalAmount,
      user: req.user._id,
    };

    // Create the order asynchronously
    const order = await Order.create(orderOptions);

    const product = await Product.findById(orderItems[0].product);

    const user = await User.findById(req.user._id);

    const userId = product.user;

    const productOwner = await User.findById(userId);

    // Send email notification
    const UserEmailContent = ` <html>
      <head>
      <style>
      /* Define your CSS styles here */
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
      }
      
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
      }
      
      h2 {
        color: #333333;
        margin-top: 0;
      }
      
      p {
        margin-bottom: 10px;
      }
      
      .highlight {
        color: #ff6600;
        font-weight: bold;
      }
      
      ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
      }
      
      li {
        margin-bottom: 10px;
      }
      
      .shipping-address {
        text-transform: uppercase;
        font-weight: bold;
        background-color: #f7f7f7;
        padding: 10px;
        border-radius: 5px;
      }
      
      .order-item {
        display: flex;
        align-items: center;
        border-bottom: 1px solid #eeeeee;
        padding-bottom: 10px;
      }
      
      .item-image img {
        width: 80px;
        height: auto;
        margin-right: 10px;
        border-radius: 5px;
      }
      
      .item-details h4 {
        color: #333333;
        margin-top: 0;
      }
      
      .footer {
        color: #999999;
        font-size: 12px;
        text-align: center;
        margin-top: 20px;
      }
    </style>
      </head>
      
    <body>
    <div class="container">
      <h2>Order Confirmation</h2>
      <p>Your order has been placed successfully.</p>
      <h3>Order Details:</h3>
      <ul>
        <li class="highlight">Shipping Info:</li>
        <li>
          <b>${shippingInfo.address.toUpperCase()}</b><br>
          ${shippingInfo.city}<br>
          ${shippingInfo.state}<br>
          ${shippingInfo.country}<br>
          ${shippingInfo.pinCode}<br>
          Phone: ${shippingInfo.phoneNo}
        </li>
        <li class="highlight">Order Items:</li>
        ${orderItems
        .map(
          (item) => `
          <li>
            <div class="order-item">
              <div class="item-image">
                <img src="${item.image}" alt="${item.name}">
              </div>
              <div class="item-details">
                <h4>${item.name}</h4>
                <p>Price: ${item.price}</p>
                <p>Quantity: ${item.quantity}</p>
              </div>
            </div>
          </li>
        `
        )
        .join("")}
        <li>Payment Method: ${paymentMethod}</li>
        <li>Items Price: ${itemsPrice}</li>
        <li>Tax Price: ${taxPrice}</li>
        <li>Shipping Charges: ${shippingCharges}</li>
        <li>Total Amount: ${totalAmount}</li>
      </ul>
      <p>Please review the details and contact us if you have any questions.</p>
      <p class="footer">This email was sent from our e-commerce shop. Please do not reply.</p>
    </div>
  </body>

</html>`;

    const OwnerEmailContent = `<html>
<head>
  <style>
    /* Define your CSS styles here */
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
    }
    
    h2 {
      color: #333333;
      margin-top: 0;
    }
    
    p {
      margin-bottom: 10px;
    }
    
    .highlight {
      color: #ff6600;
      font-weight: bold;
    }
    
    ul {
      list-style-type: none;
      padding: 0;
      margin: 0;
    }
    
    li {
      margin-bottom: 10px;
    }
    
    .shipping-address {
      text-transform: uppercase;
      font-weight: bold;
      background-color: #f7f7f7;
      padding: 10px;
      border-radius: 5px;
    }
    
    .order-item {
      display: flex;
      align-items: center;
      border-bottom: 1px solid #eeeeee;
      padding-bottom: 10px;
    }
    
    .item-image img {
      width: 80px;
      height: auto;
      margin-right: 10px;
      border-radius: 5px;
    }
    
    .item-details h4 {
      color: #333333;
      margin-top: 0;
    }
    
    .footer {
      color: #999999;
      font-size: 12px;
      text-align: center;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2 style="color: #ff6600; text-align: center;">New Order Notification</h2>
    <p style="text-align: center;">You have received a new order.</p>
    <h3 style="color: #333333;">Order Details:</h3>
    <ul>
      <li class="highlight">Shipping Info:</li>
      <li class="shipping-address">
        <strong>${shippingInfo.address.toUpperCase()}</strong><br>
        <strong>${shippingInfo.city}</strong><br>
        <strong>${shippingInfo.state}</strong><br>
        <strong>${shippingInfo.country}</strong><br>
        <strong>${shippingInfo.pinCode}</strong><br>
        <strong>Phone:</strong> ${shippingInfo.phoneNo}
      </li>
      <li class="highlight">Order Items:</li>
      ${orderItems.map((item) => `
        <li>
          <div class="order-item">
            <div class="item-image">
              <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="item-details">
              <h4>${item.name}</h4>
              <p><strong>Price:</strong> ${item.price}</p>
              <p><strong>Quantity:</strong> ${item.quantity}</p>
            </div>
          </div>
        </li>
      `).join('')}
      <li><strong>Payment Method:</strong> ${paymentMethod}</li>
      <li><strong>Items Price:</strong> ${itemsPrice}</li>
      <li><strong>Tax Price:</strong> ${taxPrice}</li>
      <li><strong>Shipping Charges:</strong> ${shippingCharges}</li>
      <li><strong>Total Amount:</strong> ${totalAmount}</li>
    </ul>
    <p>Please take necessary actions to process the order.</p>
    <p class="footer">This email was sent from our e-commerce shop. Please do not reply.</p>
  </div>
</body>
</html>`;

    await sendMail(
      user.email,
      "Your Order has placed Successfully",
      UserEmailContent
    );

    await sendMail(
      productOwner.email,
      "New Order Request",
      OwnerEmailContent

    )

    res.status(201).json({
      success: true,
      message: "Order Placed Successfully via Cash On Delivery",
      order,
    });
  } catch (error) {
    // Proper error handling
    console.error("Error placing order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to place the order",
      error: error.message,
    });
  }
};



export const getSingleOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .lean();

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found with this ID",
    });
  }

  res.status(200).json({
    success: true,
    order,
  });
};


export const getMyOrders = async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id })
    .populate({ path: "user", select: "name" })
    .select("-__v")
    .lean();

  res.status(200).json({
    success: true,
    orders,
  });
};

export const getOrderDetails = async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
    .populate({ path: "user", select: "name" })
    .select("-__v")
    .lean();

  if (!order) {

    return res.status(404).json({
      success: false,
      message: "Order not found with this ID",
    });
  }

  res.status(200).json({
    success: true,
    order,
  });
};

export const processOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "email");

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order Id",
      });
    }

    const { orderStatus } = order;

    if (orderStatus === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Order Already Delivered",
      });
    }



    let newOrderStatus = "";

    switch (orderStatus) {
      case "Placed":
        newOrderStatus = "Dispatched";
        break;
      case "Dispatched":
        newOrderStatus = "Shipped";
        order.orderItems.forEach(async (item) => {

          const productId = item.product;

          const product = await Product.findById(productId);

          if (!product) {
            throw new Error('Product not found');
          }
          // Reduce the stock of the product
          product.Stock -= item.quantity;
          await product.save();
        });
        break;
      case "Shipped":
        newOrderStatus = "In Transit";
        break;
      case "In Transit":
        newOrderStatus = "Delivered";
        order.deliveredAt = new Date(Date.now());
        break;
      default:
        break;
    }

    order.orderStatus = newOrderStatus;
    await order.save();

    const userEmail = order.user.email;

    // Send email notification to the user
    const emailContent = `Your order status has been updated to "${newOrderStatus}".`;
    await sendMail(userEmail, "Order Status Update", emailContent);

    // Update stock for shipped order items
    if (orderStatus === "Shipped") {
      async function updateStock(productId, quantity) {
        const product = await Product.findById(productId);

        if (!product) {
          throw new Error('Product not found');
        }
        console.log(
          product.Stocks
        )


        product.Stocks -= quantity;
        await product.save();
      }
    }


    res.status(200).json({
      success: true,
      message: "Status Updated Successfully",
    });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process the order",
      error: error.message,
    });
  }
};

//Vendor Thing
export const dailyCount = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    const count = orders.length;
    const orderIds = orders.map((order) => order._id);

    res.json({
      success: true,
      count,
      orderIds,
    });
  } catch (error) {
    console.error('Error fetching daily order count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily order count',
      error: error.message,
    });
  }
};

export const SearchOrder = async (req, res, next) => {
  try {
    // Validate and sanitize input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { field, value, page, limit } = req.query;

    const searchQuery = {};

    // Set the search query based on the specified field and value
    if (field && value) {
      searchQuery[field] = value;
    }

    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    };

    // Find the orders that match the search query with pagination
    const orders = await Order.paginate(searchQuery, options);

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error searching orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search orders",
      error: error.message,
    });
  }
}

export const placeOrderOnline = async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingCharges,
    totalAmount,
  } = req.body;

  const user = req.user._id;

  const orderOptions = {
    shippingInfo,
    orderItems,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingCharges,
    totalAmount,
    user,
  };

  const options = {
    amount: Number(totalAmount) * 100,
    currency: "INR",
  };
  const order = await instance.orders.create(options);

  res.status(201).json({
    success: true,
    order,
    orderOptions,
  });
};

export const paymentVerification = async (req, res, next) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    orderOptions,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body)
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;


  if (isAuthentic) {
    const payment = await Payment.create({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    await Order.create({
      ...orderOptions,
      user: "req.user._id",
      paidAt: new Date(Date.now()),
      paymentInfo: payment._id,
    });

    res.status(201).json({
      success: true,
      message: `Order Placed Successfully. Payment ID: ${payment._id}`,
    });
  } else {
    return next(new ErrorHandler("Payment Failed", 400));
  }
};












