import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const USE_MOCK_API = import.meta.env.VITE_UI_ONLY === "true" || !BASE_URL;

const MOCK_USERS_KEY = "uiOnlyUsers";
const MOCK_TODOS_KEY = "uiOnlyTodos";

const clone = (data) => JSON.parse(JSON.stringify(data));

const createDate = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
};

const defaultUsers = [
  { username: "demo", password: "demo123" },
  { username: "sunwin", password: "123456" },
];

const defaultTodos = [
  {
    todo_id: 1,
    date: createDate(0),
    content: "프로젝트 UI 확인하기",
    emoji: "💻",
    is_checked: false,
  },
  {
    todo_id: 2,
    date: createDate(0),
    content: "캘린더에서 오늘 할 일 확인",
    emoji: "📚",
    is_checked: true,
  },
  {
    todo_id: 3,
    date: createDate(1),
    content: "회원가입 화면 흐름 점검",
    emoji: "😊",
    is_checked: false,
  },
  {
    todo_id: 4,
    date: createDate(-1),
    content: "검색 기능 테스트",
    emoji: "🎯",
    is_checked: true,
  },
  {
    todo_id: 5,
    date: createDate(3),
    content: "수정 모달 디자인 확인",
    emoji: "✨",
    is_checked: false,
  },
];

const readStorage = (key, fallback) => {
  const rawValue = localStorage.getItem(key);
  if (!rawValue) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return clone(fallback);
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    localStorage.setItem(key, JSON.stringify(fallback));
    return clone(fallback);
  }
};

const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getMockTodos = () => readStorage(MOCK_TODOS_KEY, defaultTodos);

const setMockTodos = (todos) => {
  writeStorage(MOCK_TODOS_KEY, todos);
  return todos;
};

const mockApi = {
  register: async (userData) => {
    const users = readStorage(MOCK_USERS_KEY, defaultUsers);
    const nextUsers = users.some((user) => user.username === userData.username)
      ? users.map((user) =>
          user.username === userData.username
            ? { ...user, password: userData.password }
            : user
        )
      : [...users, userData];

    writeStorage(MOCK_USERS_KEY, nextUsers);

    return {
      user_id: userData.username,
      token: "ui-only-token",
    };
  },

  login: async (loginData) => {
    const users = readStorage(MOCK_USERS_KEY, defaultUsers);
    const matchedUser = users.find(
      (user) =>
        user.username === loginData.username &&
        user.password === loginData.password
    );

    return {
      user_id: matchedUser?.username || loginData.username || "demo",
      token: "ui-only-token",
    };
  },

  getTodos: async () => clone(getMockTodos()),

  getTodosByDate: async (userId, month, day) => {
    const todos = getMockTodos();
    return clone(
      todos.filter((todo) => {
        const todoDate = new Date(todo.date);
        return todoDate.getMonth() + 1 === month && todoDate.getDate() === day;
      })
    );
  },

  createTodo: async (userId, todoData) => {
    const todos = getMockTodos();
    const nextId =
      todos.length > 0 ? Math.max(...todos.map((todo) => todo.todo_id)) + 1 : 1;
    const newTodo = {
      todo_id: nextId,
      is_checked: false,
      ...todoData,
    };

    setMockTodos([...todos, newTodo]);
    return clone(newTodo);
  },

  updateTodo: async (userId, todoId, todoData) => {
    const todos = getMockTodos();
    const updatedTodos = todos.map((todo) =>
      todo.todo_id === todoId ? { ...todo, ...todoData } : todo
    );
    const updatedTodo = updatedTodos.find((todo) => todo.todo_id === todoId);

    setMockTodos(updatedTodos);
    return clone(updatedTodo);
  },

  deleteTodo: async (userId, todoId) => {
    setMockTodos(getMockTodos().filter((todo) => todo.todo_id !== todoId));
    return { success: true };
  },

  checkTodo: async (userId, todoId, todoData) => {
    const todos = getMockTodos();
    const updatedTodos = todos.map((todo) =>
      todo.todo_id === todoId ? { ...todo, ...todoData } : todo
    );
    const updatedTodo = updatedTodos.find((todo) => todo.todo_id === todoId);

    setMockTodos(updatedTodos);
    return clone(updatedTodo);
  },

  reviewTodo: async (userId, todoId, reviewData) => {
    const todos = getMockTodos();
    const updatedTodos = todos.map((todo) =>
      todo.todo_id === todoId ? { ...todo, review: reviewData } : todo
    );
    const updatedTodo = updatedTodos.find((todo) => todo.todo_id === todoId);

    setMockTodos(updatedTodos);
    return clone(updatedTodo);
  },

  searchByKeyword: async (userId, keyword) => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return clone(
      getMockTodos().filter((todo) =>
        todo.content.toLowerCase().includes(normalizedKeyword)
      )
    );
  },

  getCheckedTodos: async () =>
    clone(getMockTodos().filter((todo) => todo.is_checked)),

  getUncheckedTodos: async () =>
    clone(getMockTodos().filter((todo) => !todo.is_checked)),
};

// API 서비스 객체
const todoApi = {
  // 회원가입
  register: async (userData) => {
    console.log(userData);
    const response = await axios.post(
      `${BASE_URL}/api/users/register/`,
      userData
    );
    return response.data;
  },

  // 로그인
  login: async (loginData) => {
    console.log(loginData);
    const response = await axios.post(
      `${BASE_URL}/api/users/login/`,
      loginData
    );
    return response.data;
  },

  // 전체 투두리스트 조회
  getTodos: async (userId) => {
    const response = await axios.get(`${BASE_URL}/api/todos/${userId}`);
    return response.data;
  },

  // 날짜별 투두리스트 조회
  getTodosByDate: async (userId, month, day) => {
    const response = await axios.get(
      `${BASE_URL}/api/todos/${userId}?month=${month}&day=${day}`
    );
    return response.data;
  },

  // 투두 작성
  createTodo: async (userId, todoData) => {
    console.log(userId);
    console.log(todoData);
    const response = await axios.post(
      `${BASE_URL}/api/todos/${userId}/`,
      todoData
    );
    return response.data;
  },

  // 투두 수정
  updateTodo: async (userId, todoId, todoData) => {
    const response = await axios.patch(
      `${BASE_URL}/api/todos/${userId}/${todoId}/`,
      todoData
    );
    return response.data;
  },

  // 투두 삭제
  deleteTodo: async (userId, todoId) => {
    const response = await axios.delete(
      `${BASE_URL}/api/todos/${userId}/${todoId}/`
    );
    return response.data;
  },

  // 투두 완료
  checkTodo: async (userId, todoId, todoData) => {
    const response = await axios.patch(
      `${BASE_URL}/api/todos/${userId}/${todoId}/check/`,
      todoData
    );
    return response.data;
  },

  // 투두 리뷰
  reviewTodo: async (userId, todoId, reviewData) => {
    const response = await axios.patch(
      `${BASE_URL}/api/todos/${userId}/${todoId}/reviews/`,
      reviewData
    );
    return response.data;
  },

  // 투두 검색
  searchByKeyword: async (userId, keyword) => {
    const response = await axios.get(`${BASE_URL}/api/todos/${userId}/search/${keyword}`);
    return response.data;
  },

  // Checked 투두 확인
  getCheckedTodos: async (userId) => {
    const response = await axios.get(`${BASE_URL}/api/todos/${userId}/checked/`);
    return response.data;
  },

  // Unchecked 투두 확인
  getUncheckedTodos: async (userId) => {
    const response = await axios.get(`${BASE_URL}/api/todos/${userId}/unchecked/`);
    return response.data;
  }
};

export default USE_MOCK_API ? mockApi : todoApi;
