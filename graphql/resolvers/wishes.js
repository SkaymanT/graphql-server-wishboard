const { AuthenticationError, UserInputError } = require('apollo-server');

const Wish = require('../../models/Wish');
const User = require('../../models/User');
const checkAuth = require('../../util/check-auth');

module.exports = {
  Query: {
    async getWishes() {
      try {
        const wishs = await Wish.find().sort({ createdAt: -1 });
        return wishs;
      } catch (err) {
        throw new Error(err);
      }
    },
    async getWish(_, { wishId }) {
      try {
        const wish = await Wish.findById(wishId);
        if (wish) {
          return wish;
        } else {
          throw new Error('Wish not found');
        }
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Mutation: {
    async createWish(
      _,
      { name, price, currency, backgroundColor, image },
      context
    ) {
      const user = checkAuth(context);
      const infoUser = await User.findById(user.id);
      if (name.trim() === '') {
        throw new Error('Wish name must not be empty');
      }
      if (price.trim() === '') {
        throw new Error('Wish price must not be empty');
      }
      if (currency.trim() === '') {
        throw new Error('Wish price must not be empty');
      }
      if (backgroundColor.trim() === '') {
        throw new Error('Wish price must not be empty');
      }
      if (image.trim() === '') {
        throw new Error('Wish image must not be empty');
      }
      const newWish = new Wish({
        name,
        price: {
          value: price,
          currency,
        },
        image: {
          small: image,
        },
        backgroundColor,
        creator: {
          id: user.id,
          username: user.username,
          avatarSmall: infoUser.avatarSmall,
        },
        createdAt: new Date().toISOString(),
      });
      const wish = await newWish.save();

      context.pubsub.publish('NEW_WISH', {
        newWish: wish,
      });

      return wish;
    },
    async deleteWish(_, { wishId }, context) {
      const user = checkAuth(context);
      try {
        const wish = await Wish.findById(wishId);
        if (user.username === wish.username) {
          await wish.delete();
          return 'Wish deleted successfully';
        } else {
          throw new AuthenticationError('Action not allowed');
        }
      } catch (err) {
        throw new Error(err);
      }
    },
    async likeWish(_, { wishId }, context) {
      const { username } = checkAuth(context);

      const wish = await Wish.findById(wishId);
      if (wish) {
        if (wish.likes.find((like) => like.username === username)) {
          wish.likes = wish.likes.filter((like) => like.username !== username);
        } else {
          wish.likes.push({
            username,
            createdAt: new Date().toISOString(),
          });
        }

        await wish.save();
        return wish;
      } else throw new UserInputError('Wish not found');
    },
  },
  Subscription: {
    newWish: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator('NEW_WISH'),
    },
  },
};
