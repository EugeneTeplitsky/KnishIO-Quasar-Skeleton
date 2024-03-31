<div style="text-align:center">

![Knish.IO: Post-Blockchain Platform][logo]

</div>
<div style="text-align:center">

[eugene@wishknish.com](mailto:eugene@wishknish.com) | [https://wishknish.com](https://wishknish.com)\
Authored by [Eugene Teplitsky](https://github.com/EugeneTeplitsky)

</div>

# Quasar-based Knish.IO Application Skeleton

This project serves as a boilerplate app skeleton for building Quasar-based applications that integrate with the Knish.IO platform. It provides a foundation for basic ledger communication, user registration, and login functionality, allowing developers to quickly set up and start building their own Knish.IO applications.

## Features

- **Quasar Framework**: I'm building on top of the Quasar Framework, a powerful and flexible Vue.js-based framework for building modern web applications.
- **Knish.IO Integration**: There's included pre-configured integration with the Knish.IO ledger, enabling seamless communication for various operations.
- **User Registration**: The skeleton provides a user registration component that allows users to create new accounts by providing their email, password, and a randomly generated public username.
- **User Login**: There is a login component that enables users to authenticate and access protected routes within the application.
- **Ledger Communication**: The skeleton sets up basic ledger communication using the Knish.IO client library, allowing developers to interact with the Knish.IO ledger for data storage and retrieval.
- **Pinia Store**: The app utilizes Pinia, a state management library for Vue.js, to manage the application state and handle ledger-related operations.
- **Environment Configuration**: There is support for environment-specific configuration using `.env` files, making it easy to manage different settings for development and production environments.
- **Form Validation**: The registration and login components include form validation to ensure data integrity and provide user feedback for invalid inputs.
- **Error Handling**: The app skeleton incorporates error handling mechanisms to gracefully handle and display errors related to ledger communication and user authentication.
- **Responsive Design**: The Quasar Framework enables the creation of responsive and mobile-friendly user interfaces, ensuring a seamless experience across different devices.

## Prerequisites

Make sure you have the following prerequisites installed:

- Node.js (version 18 or higher)
- Yarn or NPM (Package Manager - though you can also use NPM in a pinch)
- Quasar CLI (Install globally using: `yarn global add @quasar/cli`)

## Getting Started

To get started, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/EugeneTeplitsky/knishio-quasar-skeleton.git
   ```

2. Navigate to the project directory:
   ```
   cd knishio-quasar-skeleton
   ```

3. Install the dependencies:
   ```
   yarn install
   ```

4. Configure the environment variables:
  - Copy the `.env.example` in the project root directory to `.env`.
  - Specify the required environment variables in the `.env` file (e.g., Knish.IO server URLs, app slug, encryption settings).

5. Start the development server:
   ```
   quasar dev
   ```

6. Open your browser and visit `http://localhost:8080` to see the application running.

## Project Structure

The project structure follows the standard Quasar Framework conventions. Here are the key directories and files that are specific to this skeleton:

- `src/models`: Contains wrapper classes around Knish.IO MetaType operations.
- `src/mixins`: Contains reusable code fragments injectable into Quasar components (such as for accessing state management functions)
- `src/libraries`: Contains helper functions and constants used throughout the project.
- `src/stores/dlt.js`: Pinia store responsible for Knish.IO session state management

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request on the GitHub repository.

When contributing, please follow the existing code style and conventions used in the project. Also, make sure to test your changes thoroughly before submitting a pull request.

## License

I'm releasing this project as open-source software licensed under the [GPLv3 License](https://opensource.org/license/gpl-3-0). Feel free to use, modify, and distribute my code as per the terms of the license.

## Acknowledgements

The Quasar-based Knish.IO Application Skeleton is built using the following open-source libraries and frameworks:

- [Quasar Framework](https://quasar.dev/)
- [Vue.js](https://vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)
- [Knish.IO Client Library](https://github.com/KnishIO/knishio-client-js)

I'd like to extend my gratitude to the developers and contributors of these projects for their valuable work.

## Contact

If you have any questions, suggestions, or feedback, please feel free to contact me at [eugene@wishknish.com](mailto:eugene@wishknish.com).

Happy coding with Knish.IO and Quasar!

[logo]: https://raw.githubusercontent.com/WishKnish/KnishIO-Technical-Whitepaper/master/KnishIO-Logo.png "Knish.IO: Post-Blockchain Platform"
