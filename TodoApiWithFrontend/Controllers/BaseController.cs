using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApiWithFrontend.Model;

namespace TodoApiWithFrontend.Controllers
{
    [Route("api/todos")]
    [ApiController]
    public class BaseController : ControllerBase
    {
        private readonly TodoContext _context;

        public BaseController(TodoContext context)
        {
            _context = context;
        }

        // GET: api/Base
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TodoItem>>> GetTodoItems()
        {
            return await _context.TodoItems.ToListAsync();
        }

        // GET: api/Base/5
        [HttpGet("/api/todos/{id}")]
        public async Task<ActionResult<TodoItem>> GetTodoItem(long id)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);

            if (todoItem == null)
            {
                return NotFound();
            }
            return todoItem;
        }

        [HttpPut("/api/todos/{id}/toggle")]
        public async Task<NoContentResult> ToggleTodoItem(long id)
        {
            foreach (var item in _context.TodoItems)
            {
                if (item.Id == id)
                {
                    item.IsComplete = !item.IsComplete;
                    _context.Entry(item).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                    return NoContent();
                }
            }
            return NoContent();
        }

        [HttpPut("/api/todos/toggle-all")]
        public async Task<NoContentResult> ToggleAllItem(long id)
        {
            foreach (var item in _context.TodoItems)
            {
                item.IsComplete = true;
                _context.Entry(item).State = EntityState.Modified;
                await _context.SaveChangesAsync();
            }
            return NoContent();

        }

        // PUT: api/Base/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("/api/todos/{id}")]
        public async Task<IActionResult> PutTodoItem(long id, TodoItem todoItem)
        {
            if (id != todoItem.Id)
            {
                return BadRequest();
            }

            _context.Entry(todoItem).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TodoItemExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Base
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<TodoItem>> PostTodoItem(TodoItem todoItem)
        {
            _context.TodoItems.Add(todoItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTodoItem", new { id = todoItem.Id }, todoItem);
        }

        // DELETE: api/Base/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTodoItem(long id)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
            {
                return NotFound();
            }

            _context.TodoItems.Remove(todoItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TodoItemExists(long id)
        {
            return _context.TodoItems.Any(e => e.Id == id);
        }

        [HttpDelete("/api/todos/completed")]
        public NoContentResult ClearCompleted()
        {
            List<TodoItem> todoItemsToRemove = new List<TodoItem>();

            foreach (var data in _context.TodoItems)
            {

                if (data.IsComplete)
                {
                    todoItemsToRemove.Add(data);
                }
            }

            foreach (var item in todoItemsToRemove)
            {
                _context.TodoItems.Remove(item);
            }

            _context.SaveChangesAsync();

            return NoContent();


        }
    }
}
