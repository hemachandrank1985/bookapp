import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables if any
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection String (loaded from environment)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('CRITICAL: MONGODB_URI environment variable is not defined.');
  process.exit(1);
}

console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
  });

// Schema Transformations (Map MongoDB _id to standard client id)
const transformJson = (doc, ret) => {
  if (ret._id) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
  delete ret.__v;
  return ret;
};

const transformOptions = {
  toJSON: { transform: transformJson },
  toObject: { transform: transformJson }
};

// Mongoose Schemas & Models
const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, transformOptions);

const ManagerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, transformOptions);

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  discipline: { type: String, required: true },
  publisher: { type: String, required: true },
  targetPublicationDate: { type: String, required: true },
  editorName: { type: String, required: true },
  totalChapters: { type: Number, required: true },
  status: { type: String, default: 'Planning' },
  assignedManagerId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
}, transformOptions);

const ChapterSchema = new mongoose.Schema({
  bookId: { type: String, required: true },
  chapterNumber: { type: Number, required: true },
  chapterTitle: { type: String, required: true },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  status: { type: String, default: 'Not Started' },
  dueDate: { type: String, required: true },
  submissionDate: { type: String, default: null },
  editorNotes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, transformOptions);

const Admin = mongoose.model('Admin', AdminSchema);
const Manager = mongoose.model('Manager', ManagerSchema);
const Book = mongoose.model('Book', BookSchema);
const Chapter = mongoose.model('Chapter', ChapterSchema);


// API ENDPOINTS

// --- Auth Endpoints ---

app.get('/api/auth/admins', async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin email is already registered.' });
    }

    const newAdmin = new Admin({
      name,
      email: email.toLowerCase(),
      password
    });

    await newAdmin.save();
    res.status(201).json(newAdmin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase();

    // Check Admins
    const admin = await Admin.findOne({ email: cleanEmail, password });
    if (admin) {
      return res.json({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'Admin'
      });
    }

    // Check Managers
    const manager = await Manager.findOne({ email: cleanEmail, password });
    if (manager) {
      return res.json({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        role: 'Manager'
      });
    }

    res.status(400).json({ error: 'Invalid email or password.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Managers Endpoints ---

app.get('/api/managers', async (req, res) => {
  try {
    const list = await Manager.find().sort({ name: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/managers', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingManager = await Manager.findOne({ email: email.toLowerCase() });
    if (existingManager) {
      return res.status(400).json({ error: 'A manager with this email is already registered.' });
    }

    const newManager = new Manager({
      name,
      email: email.toLowerCase(),
      password
    });

    await newManager.save();
    res.status(201).json(newManager);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/managers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Manager.findByIdAndDelete(id);
    await Book.updateMany({ assignedManagerId: id }, { assignedManagerId: null });
    res.json({ message: 'Manager deleted and assigned books released.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Books Endpoints ---

app.get('/api/books', async (req, res) => {
  try {
    const list = await Book.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { title, discipline, publisher, targetPublicationDate, editorName, totalChapters, assignedManagerId, status } = req.body;
    
    const newBook = new Book({
      title,
      discipline,
      publisher,
      targetPublicationDate,
      editorName,
      totalChapters: Number(totalChapters),
      assignedManagerId: assignedManagerId || null,
      status: status || 'Planning'
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, discipline, publisher, targetPublicationDate, editorName, totalChapters, assignedManagerId, status } = req.body;

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      {
        title,
        discipline,
        publisher,
        targetPublicationDate,
        editorName,
        totalChapters: Number(totalChapters),
        assignedManagerId: assignedManagerId || null,
        status
      },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ error: 'Book project not found.' });
    }

    res.json(updatedBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Book.findByIdAndDelete(id);
    await Chapter.deleteMany({ bookId: id });
    res.json({ message: 'Book project and all its chapters successfully deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Chapters Endpoints ---

app.get('/api/chapters', async (req, res) => {
  try {
    const list = await Chapter.find().sort({ bookId: 1, chapterNumber: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chapters', async (req, res) => {
  try {
    const { bookId, chapterNumber, chapterTitle, authorName, authorEmail, status, dueDate, submissionDate, editorNotes } = req.body;

    const newChapter = new Chapter({
      bookId,
      chapterNumber: Number(chapterNumber),
      chapterTitle,
      authorName,
      authorEmail,
      status: status || 'Not Started',
      dueDate,
      submissionDate: submissionDate || null,
      editorNotes: editorNotes || ''
    });

    await newChapter.save();
    res.status(201).json(newChapter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { bookId, chapterNumber, chapterTitle, authorName, authorEmail, status, dueDate, submissionDate, editorNotes } = req.body;

    const updatedChapter = await Chapter.findByIdAndUpdate(
      id,
      {
        bookId,
        chapterNumber: Number(chapterNumber),
        chapterTitle,
        authorName,
        authorEmail,
        status,
        dueDate,
        submissionDate,
        editorNotes,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedChapter) {
      return res.status(404).json({ error: 'Chapter not found.' });
    }

    res.json(updatedChapter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Chapter.findByIdAndDelete(id);
    res.json({ message: 'Chapter successfully deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Start server locally (if not running in serverless environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

// Export for Vercel Serverless Function
export default app;
