const express = require('express');
const { Todo } = require('../mongo')
const { getAsync, setAsync } = require('../redis')
const router = express.Router();

/* GET todos listing. */
router.get('/', async (_, res) => {
  const todos = await Todo.find({})
  res.send(todos);
});

/* POST todo to listing. */
router.post('/', async (req, res) => {
  const todo = await Todo.create({
    text: req.body.text,
    done: false
  })

  const curCounter = await getAsync("added_todos")

  await setAsync("added_todos", Number(curCounter) + 1)

  res.send(todo)
});

/* GET statistics */
router.get('/statistics', async (req, res) => {
  const curCounter = await getAsync("added_todos")
  res.json({ added_todos: curCounter })
})

const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params
  console.log('findByIdMiddleware id:', id)
  req.todo = await Todo.findById(id)
  if (!req.todo) {
    return res.sendStatus(404)
  }

  next()
}

/* DELETE todo. */
singleRouter.delete('/', async (req, res) => {
  await req.todo.delete()
  res.sendStatus(200);
});

/* GET */
singleRouter.get('/', async (req, res, next) => {
  // console.log('data from middleware: ', req.todo)
  res.json(req.todo);
});

/* PUT todo. */
singleRouter.put('/', async (req, res) => {
  if (req.body.hasOwnProperty('text')) {
    req.todo.text = req.body.text
  }

  if (req.body.hasOwnProperty('done')) {
    req.todo.done = (req.body.done.toLowerCase() === 'true') ? true : false
  }

  const updatedTodo = await req.todo.save(req.todo)
  res.json(updatedTodo)
});

router.use('/:id', findByIdMiddleware, singleRouter)


module.exports = router;
