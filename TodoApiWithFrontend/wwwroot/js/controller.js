class Controller {

    /**
     * @param {!View} view A View instance
     */
    constructor(view) {
        Controller.GET = "GET";
        Controller.POST = "POST";
        Controller.PUT = "PUT";
        Controller.DELETE = "DELETE";

        this.view = view;
        this._activeState = '';
        this._lastActiveState = null;

        view.bindAddItem(this.addItem.bind(this));
        view.bindEditItemSave(this.editItemSave.bind(this));
        view.bindEditItemCancel(this.editItemCancel.bind(this));
        view.bindRemoveItem(this.removeItem.bind(this));
        view.bindToggleItem(this.toggleCompleted.bind(this));
        view.bindRemoveCompleted(this.removeCompletedItems.bind(this));
        view.bindToggleAll(this.toggleAll.bind(this));

        view.bindFilterAll(this.updateState.bind(this));
        view.bindFilterActive(this.updateState.bind(this));
        view.bindFilterComplete(this.updateState.bind(this));

        this.updateState('');
    }

    updateState(newState) {
        this._activeState = newState;
        this._refresh();
        this.view.updateFilterButtons(newState);
    }


    /**
     * Sends an AJAX request.
     * @param endpoint The endpoint of the request, for example "/login"
     * @param method Request method. Can be "GET", "POST", "PUT", "DELETE",..
     * @param params Parameters in URL format, like "param1=3&param3=asdf"
     * @param body Content of request body
     * @param onSuccess A function to call when the request completes successfully.
     *                  The data will be in event.target.response
     */
    sendAjax(endpoint, method, params = null, body = null, onSuccess = null) {
        const scope = this;
        const requestOptions = { method: method, body: body };
        if (method === Controller.POST || method === Controller.PUT) {
            requestOptions.headers = { "Content-type": "application/json" };
        }
        let uri = `api/${endpoint}`;
        uri += !!params ? `?${params}` : "";
        fetch(uri, requestOptions)
            .then(response => {
                if (!response.ok) {
                    console.log("Request failed for " + endpoint + " HTTP status:" + response.status);
                    // Read the response
                    response.text().then(data => console.log("Response body: " + data));
                    return;
                }
                // Read the response
                response.text().then(data => onSuccess.call(scope, data));
            })
            .catch(function (err) {
                console.error("Request failed for " + endpoint + " error: " + err);
            });
    }

    /**
     * Add an item and display it in the list.
     */
    addItem(title) {
        let newTodo = {
            name: title,
            isComplete: false
        };
        this.sendAjax("todos", Controller.POST, null, JSON.stringify(newTodo), function (data) {
            this.view.clearNewTodo();
            this._refresh(true);
        });
    }

    /**
     * Save an item in edit.
     */
    editItemSave(item) {
        if (item.name.length) {
            this.sendAjax("todos/" + item.id, Controller.PUT, null, JSON.stringify(item), function (data) {
                this.view.editItemDone(item.id, item.name);
            });
        } else {
            this.removeItem(item.id);
        }
    }

    /**
     * Cancel the item editing mode.
     */
    editItemCancel(id) {
        this.sendAjax("todos/" + id, Controller.GET, null, null, function (data) {
            const item = JSON.parse(data);
            this.view.editItemDone(id, item.name);
        });
    }

    /**
     * Remove the data and elements related to an Item.
     */
    removeItem(id) {
        this.sendAjax("todos/" + id, Controller.DELETE, null, null, function (data) {
            this.view.removeItem(id);
        });
    }

    /**
     * Remove all completed items.
     */
    removeCompletedItems() {
        this.sendAjax("todos/completed", Controller.DELETE, null, null, function (data) {
            this._refresh(true);
        });
    }

    /**
     * Update an item in based on the state of completed.
     */
    toggleCompleted(id) {
        this.sendAjax(`todos/${id}/toggle`, Controller.PUT, null, null, function (data) {
            this._refresh(true);
        });
    }

    /**
     * Set all items to complete or active.
     */
    toggleAll(completed) {
        this.sendAjax("todos/toggle-all", Controller.PUT, "completed=" + completed, null, function (data) {
            this._refresh(true);
        });
    }

    /**
     * Refresh the list based on the current route.
     */
    _refresh(force) {
        const state = this._activeState;

        if (force || this._lastActiveState !== '' || this._lastActiveState !== state) {
            // an item looks like: {id:abc, name:"something", isCompleted:true}
            this.sendAjax("todos", Controller.GET, null, null, function (data) {
                const respObj = JSON.parse(data);
                let filteredItems = respObj;
                if (state !== "") {
                    let completeFilter = state === "complete";
                    filteredItems = filteredItems.filter(item => item.isComplete === completeFilter);
                }
                this.view.showItems(filteredItems);

                const total = respObj.length;
                const completed = respObj.filter(item => item.isComplete === true).length;
                const active = total - completed;

                this.view.setItemsLeft(active);
                this.view.setClearCompletedButtonVisibility(completed > 0);

                this.view.setCompleteAllCheckbox(completed === total);
                this.view.setMainVisibility(total > 0);
            });
        }
        this._lastActiveState = state;
    }
}
