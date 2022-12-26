import { startTransition, useEffect, useState } from "react";
import FirebaseAuthService from "./FirebaseAuthService";
import LoginForm from "./components/LoginForm";
import AddEditRecipeForm from "./components/AddEditRecipeForm";
import "./App.css";
import FirebaseFirestoreService from "./FirebaseFirestoreService";
import { renderIntoDocument } from "react-dom/test-utils";

function App() {
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [orderBy, setOrderBy] = useState("publishDateDesc");
  const [recipesPerPage, setRecipesPerPage] = useState(3);

  useEffect(() => {
    setIsLoading(true);
    fetchRecipes()
      .then((fetchedRecipes) => setRecipes(fetchedRecipes))
      .catch((error) => {
        console.error(error.message);
        throw error;
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, categoryFilter, orderBy, recipesPerPage]);

  FirebaseAuthService.subscribeToAuthChanges(setUser);

  async function fetchRecipes(cursorId = "") {
    const queries = [];

    if (categoryFilter) {
      queries.push({
        field: "category",
        condition: "==",
        value: categoryFilter,
      });
    }
    if (!user) {
      queries.push({
        field: "isPublished",
        condition: "==",
        value: true,
      });
    }

    const orderByField = "publishDate";
    let orderByDirection;
    if (orderBy) {
      switch (orderBy) {
        case "publishDateAsc":
          orderByDirection = "asc";
          break;
        case "publishDateDesc":
          orderByDirection = "desc";
          break;
        default:
          break;
      }
    }

    let fetchedRecipes = [];
    try {
      const response = FirebaseFirestoreService.readDocuments({
        collection: "recipes",
        queries: queries,
        orderByField: orderByField,
        orderByDirection: orderByDirection,
        perPage: recipesPerPage,
        cursorId: cursorId,
      });
      const newRecipes = (await response).docs.map((recipeDoc) => {
        const id = recipeDoc.id;
        const data = recipeDoc.data();
        data.publishDate = new Date(data.publishDate.seconds * 1000);

        return { ...data, id };
      });

      if (cursorId) {
        fetchedRecipes = [...recipes, ...newRecipes];
      } else {
        fetchedRecipes = [...newRecipes];
      }
    } catch (error) {
      console.error(error.message);
      throw error;
    }

    return fetchedRecipes;
  }

  function handleRecipesPerPageChange(event) {
    const recipesPerPage = event.target.value;
    startTransition(() => {
      setRecipes([]);
      setRecipesPerPage(recipesPerPage);
    });
  }

  function handleLoadMoreRecipesClick(params) {
    const lastRecipe = recipes[recipes.length - 1];
    const cursorId = lastRecipe.id;
    handleFetchRecipes(cursorId);
  }

  async function handleFetchRecipes(cursorId = "") {
    try {
      const fetchedRecipes = await fetchRecipes(cursorId);
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }

  async function handleAddRecipe(newRecipe) {
    try {
      const response = await FirebaseFirestoreService.createDocument(
        "recipes",
        newRecipe
      );

      handleFetchRecipes();

      alert(`Successfully create a recipe with ID= ${response.id}`);
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleUpdateRecipe(newRecipe, recipeId) {
    try {
      await FirebaseFirestoreService.updateDocument(
        "recipes",
        recipeId,
        newRecipe
      );
      handleFetchRecipes();
      alert(`Successfully update a recipe with ID= ${recipeId}`);
      setCurrentRecipe(null);
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }

  async function handleDeleteRecipe(recipeId) {
    const deleteConfirmation = window.confirm(
      "Are you sure you want to delete this recipe?"
    );
    if (deleteConfirmation) {
      try {
        await FirebaseFirestoreService.deleteDocument("recipes", recipeId);
        handleFetchRecipes();
        startTransition(() => {
          setCurrentRecipe(null);
        });
        window.scrollTo(0, 0);
        alert(`Successfully delete a recipe with ID= ${recipeId}`);
      } catch (error) {
        console.error(error.message);
        throw error;
      }
    }
  }

  function handleEditRecipeClick(recipeId) {
    const selectedRecipe = recipes.find((item) => recipeId === item.id);
    if (selectedRecipe) {
      // setCurrentRecipe(selectedRecipe);
      startTransition(() => {
        setCurrentRecipe(selectedRecipe);
      });
      window.scrollTo(0, document.body.scrollHeight);
    }
  }

  function handleEditRecipeCancel() {
    startTransition(() => {
      setCurrentRecipe(null);
    });
  }

  function lookupCategoryLabel(categoryKey) {
    const categories = {
      breadsSandwichesAndPizza: "Breads, Sandwiches and Pizza",
      dessertsAndBakedGoods: "Desserts & Baked Goods",
      eggsAndBreakfast: "Eggs & Breakfast",
      fishAndSeafood: "Fish & Seafood",
      vegetables: "Vegetables",
    };

    const label = categories[categoryKey];
    return label;
  }

  function formatDate(date) {
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getFullYear();
    const dateString = `${month}-${day}-${year}`;
    return dateString;
  }

  return (
    <div className="App">
      <div className="title-row">
        <h1 className="title">Firebase Recipes</h1>
        <LoginForm existingUser={user} />
      </div>
      <div className="main">
        <div className="row filters">
          <label className="recipe-label input-label">
            Category:
            <select
              value={categoryFilter}
              onChange={(e) => {
                startTransition(() => {
                  setCategoryFilter(e.target.value);
                });
              }}
              className="select"
            >
              <option value={""}></option>
              <option value={"breadsSandwichesAndPizza"}>
                Breads, Sandwiches and Pizza
              </option>
              <option value={"eggsAndBreakfast"}>Eggs & Breakfast</option>
              <option value={"dessertsAndBakedGoods"}>
                Desserts & Baked Goods
              </option>
              <option value={"fishAndSeafood"}>Fish & Seafood</option>
              <option value={"vegetables"}>Vegetables</option>
            </select>
          </label>

          <label className="input-label">
            <select
              value={orderBy}
              onChange={(e) => {
                startTransition(() => {
                  setOrderBy(e.target.value);
                });
              }}
              className="select"
            >
              <option value={"publishDateDesc"}>
                Publish Date (newest - oldest)
              </option>
              <option value={"publishDateAsc"}>
                Publish Date (oldest - newest)
              </option>
            </select>
          </label>
        </div>
        <div className="center">
          <div className="recipe-list-box">
            {isLoading ? (
              <div className="fire">
                <div className="flames">
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                </div>
                <div className="logs"></div>
              </div>
            ) : null}
            {!isLoading && recipes && recipes.length === 0 ? (
              <h5 className="no-recipes">No Recipes Found</h5>
            ) : null}
            {recipes && recipes.length > 0 ? (
              <div className="recipe-list">
                {recipes.map((item) => {
                  return (
                    <div className="recipe-card" key={item.id}>
                      {!item.isPublished ? (
                        <div className="unpublished">UNPUBLISHED</div>
                      ) : null}
                      <div className="recipe-name">{item.name}</div>
                      <div className="recipe-image-box">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={renderIntoDocument.name}
                            className="recipe-image"
                          />
                        ) : null}
                      </div>
                      <div className="recipe-field">
                        Category: {lookupCategoryLabel(item.category)}
                      </div>
                      <div className="recipe-field">
                        Publish Date: {formatDate(item.publishDate)}
                      </div>
                      {user ? (
                        <button
                          type="button"
                          onClick={() => handleEditRecipeClick(item.id)}
                          className="primary-button"
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
        {isLoading || (recipes && recipes.length > 0) ? (
          <>
            <label className="input-label">
              Recipes Per Page:
              <select
                value={recipesPerPage}
                onChange={handleRecipesPerPageChange}
                className="select"
              >
                <option value={"3"}>3</option>

                <option value={"6"}>6</option>
                <option value={"9"}>9</option>
              </select>
            </label>
            <div className="pagination">
              <button
                type="button"
                className="primary-button"
                onClick={handleLoadMoreRecipesClick}
              >
                Load More
              </button>
            </div>
          </>
        ) : null}
        {user ? (
          <AddEditRecipeForm
            existingRecipe={currentRecipe}
            handleAddRecipe={handleAddRecipe}
            handleUpdateRecipe={handleUpdateRecipe}
            handleEditRecipeCancel={handleEditRecipeCancel}
            handleDeleteRecipe={handleDeleteRecipe}
          ></AddEditRecipeForm>
        ) : null}
      </div>
    </div>
  );
}

export default App;
