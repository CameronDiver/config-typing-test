import { Either, isRight } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import * as _ from 'lodash';

const StringBoolean = new t.Type<boolean, string>(
	'StringBoolean',
	_.isBoolean,
	(m, c) =>
		t.string.validate(m, c).chain(s => {
			let b: boolean;
			if (s === 'true') {
				b = true;
			} else if (s === 'false') {
				b = false;
			} else {
				return t.failure(s, c);
			}
			return t.success(b);
		}),
	a => a.toString(),
);

const schema = {
	one: { source: 'test' },
	two: { source: 'test', default: 123 },
	three: { source: 'test'},
	five: { source: 'test'},
};

const fnSchema = {
	four: (): null | number => {
		return 4;
	},
};

const schemaTypes = {
	one: { type: t.string, default: t.undefined },
	two: { type: t.number, default: 123},
	three: { type: t.boolean, default: t.undefined },
	four: { type: t.union([t.null, t.number]), default: t.union([t.null, t.number])},
	five: { type: StringBoolean, default: t.undefined },
};

type Schema = typeof schema;
type SchemaKey = keyof Schema;
type FnSchema = typeof fnSchema;
type FnSchemaKey = keyof FnSchema;
type SchemaTypes = typeof schemaTypes;
type SchemaTypesKeys = keyof SchemaTypes;

type RealType<T> = T extends t.Type<any> ? t.TypeOf<T> : T;

const retrieveKey = <T extends SchemaKey>(
	key: T,
): Either<t.Errors, t.TypeOf<SchemaTypes[T]['type']>> => {
	switch (key) {
		case 'one':
			return t.string.decode('test');
		case 'two':
			return t.number.decode(123);
		case 'three':
			return t.boolean.decode(false);
		case 'five':
			return StringBoolean.decode('true');
		default:
			throw new Error('test');
	}
};

function getSchema<T extends SchemaKey>(
	key: T,
): t.TypeOf<SchemaTypes[T]['type']> | RealType<SchemaTypes[T]['default']> {
	const val = retrieveKey(key);
	if (isRight(val)) {
		return val.value;
	} else {
		const value = schemaTypes[key];
		if (value.default instanceof t.type) {
			// has to be undefined
			return undefined as any;
		} else {
			return value.default as any;
		}
	}
}

function getFn<T extends FnSchemaKey>(key: T): ReturnType<FnSchema[T]> {
	return fnSchema[key]() as ReturnType<FnSchema[T]>;
}

function get<T extends SchemaKey>(
	key: T,
): t.TypeOf<SchemaTypes[T]['type']> | RealType<SchemaTypes[T]['default']>;
function get<T extends FnSchemaKey>(key: T): ReturnType<FnSchema[T]>;
function get<T extends SchemaKey | FnSchemaKey>(key: T) {
	if (schema.hasOwnProperty(key)) {
		return getSchema(key as SchemaKey);
	} else {
		return getFn(key as FnSchemaKey);
	}
}

function getMany<T extends SchemaTypesKeys>(
	keys: T[],
): {
	[key in T]: t.TypeOf<SchemaTypes[key]['type']> | RealType<SchemaTypes[key]['default']>
} {
	return _.fromPairs(_.map(keys, k => [k, get(k as SchemaKey)]));
}

const a = get('one');
const b = get('two');
const c = get('three');
const d = get('four');
const e = get('five');

if (a.indexOf('test')) {
	console.log('test');
}

const vals = getMany(['one', 'two', 'three', 'four', 'five']);
vals.
