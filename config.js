const config = {
  gistId: '2886a159d1e20d6aa2561bea3effe610', // Replace with your Gist ID
  token: 'g***hp_g8GAqe***6FNerPk4algf***dt3HHczOzM***uE0zGmEz', // Tampered token
};

const getToken = () => config.token.split('*').join('');

export { config, getToken };
