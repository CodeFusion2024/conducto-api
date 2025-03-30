import Store from "../models/Store.js";

// Create a new store
export const createStore = async (req, res) => {
  try {
    const { name, address, phone, email, latitude, longitude, owner } = req.body;

    const newStore = new Store({
      name,
      address,
      phone,
      email,
      owner,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });

    await newStore.save();
    res.status(201).json({ message: "Store created successfully", store: newStore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all stores
export const getStores = async (req, res) => {
  try {
    const stores = await Store.find();
    res.status(200).json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get stores within 10 km of the user
export const getNearbyStores = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude and Longitude are required" });
    }

    const stores = await Store.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: 10000, // 10 km in meters
        },
      },
    });

    res.status(200).json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update store
export const updateStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const updatedStore = await Store.findByIdAndUpdate(storeId, req.body, { new: true });

    if (!updatedStore) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.status(200).json({ message: "Store updated successfully", store: updatedStore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const addReview = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { userId, rating, comment } = req.body;

    // Find the store
    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    // Check if the user has already reviewed
    const existingReview = store.reviews.find((r) => r.user.toString() === userId);
    if (existingReview) return res.status(400).json({ message: "You have already reviewed this store" });

    // Add new review
    store.reviews.push({ user: userId, rating, comment });

    // Update total reviews & average rating
    store.totalReviews = store.reviews.length;
    store.averageRating =
      store.reviews.reduce((sum, r) => sum + r.rating, 0) / store.totalReviews;

    await store.save();
    res.status(201).json({ message: "Review added successfully", store });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get Store with Reviews
export const getStoreWithReviews = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await Store.findById(storeId).populate("reviews.user", "name email");
    if (!store) return res.status(404).json({ message: "Store not found" });

    res.status(200).json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// Delete store
export const deleteStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const deletedStore = await Store.findByIdAndDelete(storeId);

    if (!deletedStore) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.status(200).json({ message: "Store deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
