USO DE ADAPTER

el roblema es que El legacyModerationApi devuelve tipos mixtos: "OK", "BLOCK", un numero y un booleano y el controller tiene unos if/else if/else complejos para interpretar las respuestas. Esa lógica está mezclada con la lógica de negocio.
la solución fue crear una interfaz ModerationService con un método isBlocked que absorbe toda esa lógica de traducción y expone un método simple. también se implementó un LegacyModerationAdapter que envuelve al legacyModerationApi y traduce todos sus tipos a ese booleano simple. El controller solo llama moderationService.isBlocked.
