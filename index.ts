"use strict";

/**
* Polyfit
* @class
*/

interface NumberArrayConstructor {
	new (length: number): NumberArray;
	new (buffer: ArrayBuffer, byteOffset?: number, length?: number): NumberArray;
	BYTES_PER_ELEMENT: number;
}

interface NumberArray {
	length: number;
	[index: number]: number;
}

export = Polyfit;
class Polyfit<T extends NumberArray> {
	private x: T;
	private y: T;
	private FloatXArray: NumberArrayConstructor;
	private BYTES_PER_ELEMENT: number;
	
	/**
	 * Polyfit
     * @class
	 * @param {number[]|Float32Array|Float64Array} x
	 * @param {number[]|Float32Array|Float64Array} y
	 */
	constructor(
		x : T,
		y : T
	) {
	
		// Make sure we return an instance
		if (!(this instanceof Polyfit)) return new Polyfit(x, y);
	
		// Check that x any y are both arrays of the same type
		if (!((x instanceof Array && y instanceof Array) ||
			(x instanceof Float32Array && y instanceof Float32Array) ||
			(x instanceof Float64Array && y instanceof Float64Array)
		)) {
			throw new Error('x and y must be arrays');
		}
		
		if (x instanceof Float32Array) {
			this.FloatXArray = Float32Array;
		} else if (x instanceof Float64Array) {
			this.FloatXArray = Float64Array;
		}
	
		// Make sure we have equal lengths
		if (x.length !== y.length) {
			throw new Error('x and y must have the same length');
		}
	
		this.x = x;
		this.y = y;
	
	}
	
	/**
	 * Perform gauss-jordan division
	 * 
	 * @param {number[][]|Float32Array[]|Float64Array[]} matrix - is getting modified
	 * @param {number} row
	 * @param {number} col
	 * @param {number} numCols
	 * @returns void
	 */
	static gaussJordanDivide<T extends NumberArray>(
		matrix  : T[],
		row     : number,
		col     : number,
		numCols : number
	): void {
	
		for (var i = col + 1; i < numCols; i++) {
			matrix[row][i] /= matrix[row][col];
		}
	
		matrix[row][col] = 1;
	
	};
	
	/**
	 * Perform gauss-jordan elimination
	 * 
	 * @param {number[][]|Float64Array[]} matrix - is getting modified
	 * @param {number} row
	 * @param {number} col
	 * @param {number} numRows
	 * @param {number} numCols
	 * @returns void
	 */
	static gaussJordanEliminate<T extends NumberArray>(
		matrix  : T[],
		row     : number,
		col     : number,
		numRows : number,
		numCols : number
	): void {
	
		for (var i = 0; i < numRows; i++) {
			if (i != row && matrix[i][col] !== 0) {
				for (var j = col + 1; j < numCols; j++) {
					matrix[i][j] -= matrix[i][col] * matrix[row][j];
				}
				matrix[i][col] = 0;
			}
		}
	
	};
	
	/**
	 * Perform gauss-jordan echelon method
	 * 
	 * @param {number[][]|Float32Array[]|Float64Array[]} matrix - is getting modified
	 * @returns {number[][]|Float32Array[]|Float64Array[]} matrix
	 */
	static gaussJordanEchelonize<T extends NumberArray>(
		matrix: T[]
	): T[] {
	
		var rows = matrix.length;
		var cols = matrix[0].length;
		var i = 0;
		var j = 0;
		var k: number;
		var swap: T;
	
		while (i < rows && j < cols) {
			k = i;
			// Look for non-zero entries in col j at or below row i
			while (k < rows && matrix[k][j] === 0) {
				k++;
			}
			// If an entry is found at row k
			if (k < rows) {
				// If k is not i, then swap row i with row k
				if (k != i) {
					swap = matrix[i];
					matrix[i] = matrix[k];
					matrix[k] = swap;
				}
				// If matrix[i][j] is != 1, divide row i by matrix[i][j]
				if (matrix[i][j] != 1) {
					Polyfit.gaussJordanDivide(matrix, i, j, cols);
				}
				// Eliminate all other non-zero entries
				Polyfit.gaussJordanEliminate(matrix, i, j, rows, cols);
				i++;
			}
			j++;
		}
	
		return matrix;
	
	};
	
	/**
	 * Perform regression
	 * 
	 * @param {number} x
	 * @param {number[]|Float32Array[]|Float64Array[]} terms
	 * @returns {number}
	 */
	static regress<T extends NumberArray>(
		x     : number,
		terms : T
	): number {
	
		var a = 0;
		var exp = 0;
	
		for (var i = 0, len = terms.length; i < len; i++) {
			a += terms[i] * Math.pow(x, exp++);
		}
	
		return a;
	
	};
	
	/**
	 * Compute correlation coefficient
	 * 
	 * @param {number[]|Float32Array[]|Float64Array[]} terms
	 * @returns {number}
	 */
	public correlationCoefficient(
		terms : T
	): number {
	
		var r = 0;
		var n = this.x.length;
		var sx = 0;
		var sx2 = 0;
		var sy = 0;
		var sy2 = 0;
		var sxy = 0;
		var x: number;
		var y: number;
	
		for (var i = 0; i < n; i++) {
			x = Polyfit.regress(this.x[i], terms);
			y = this.y[i];
			sx += x;
			sy += y;
			sxy += x * y;
			sx2 += x * x;
			sy2 += y * y;
		}
	
		var div = Math.sqrt((sx2 - (sx * sx) / n) * (sy2 - (sy * sy) / n));
	
		if (div !== 0) {
			r = Math.pow((sxy - (sx * sy) / n) / div, 2);
		}
	
		return r;
	
	};
	
	/**
	 * Run standard error function
	 * 
	 * @param {number[]|Float32Array[]|Float64Array[]} terms
	 * @returns number
	 */
	public standardError(
		terms : T
	): number {
	
		var r = 0;
		var n = this.x.length;
	
		if (n > 2) {
			var a = 0;
			for (var i = 0; i < n; i++) {
				a += Math.pow((Polyfit.regress(this.x[i], terms) - this.y[i]), 2);
			}
			r = Math.sqrt(a / (n - 2));
		}
	
		return r;
	
	};
	
	/**
	 * Compute coefficients for given data matrix
	 * 
	 * @param {number} p
	 * @returns {number[]|Float32Array|Float64Array}
	 */
	public computeCoefficients(
		p : number
	): T {
	
		var n = this.x.length;
		var r: number;
		var c: number;
		var rs = 2 * (++p) - 1;
		var i: number;
	
		var m: any[] = [];
	
		// Initialize array with 0 values
		if (this.FloatXArray) {
			// fast FloatXArray-Matrix init
			var bytes_per_row = (p+1) * this.FloatXArray.BYTES_PER_ELEMENT;
			var buffer = new ArrayBuffer(p * bytes_per_row);
            for (i = 0; i < p; i++) {
                m[i] = new this.FloatXArray(buffer, i * bytes_per_row, p+1);
            }
		} else {
			for (i = 0; i < p; i++) {
				var mm = [];
				for (var j = 0; j <= p; j++) {
					mm[j] = 0;
				}
				m[i] = mm;
			}
		}
	
		var mpc = [n];
	
		for (i = 1; i < rs; i++) {
			mpc[i] = 0;
		}
	
		for (i = 0; i < n; i++) {
			var x = this.x[i];
			var y = this.y[i];
	
			// Process precalculation array
			for (r = 1; r < rs; r++) {
				mpc[r] += Math.pow(x, r);
			}
			// Process RH column cells
			m[0][p] += y;
			for (r = 1; r < p; r++) {
				m[r][p] += Math.pow(x, r) * y;
			}
		}
	
		// Populate square matrix section
		for (r = 0; r < p; r++) {
			for (c = 0; c < p; c++) {
				m[r][c] = mpc[r + c];
			}
		}
	
		Polyfit.gaussJordanEchelonize<T>(m);
	
		var terms: any = this.FloatXArray && <T>new this.FloatXArray(m.length) || [];
	
		for (i = m.length - 1; i >= 0; i--) {
			terms[i] = m[i][p];
		}
	
		return terms;
	
	};
	
	/**
	 * Using given degree of fitment, return a function that will calculate the y for a given x
	 * 
	 * @param {number} degree
	 * @returns {Function}
	 */
	public getPolynomial(
		degree : number
	): Function /* (x: number) => number */ {
	
		if (isNaN(degree) || degree < 0) throw new Error('Degree must be a positive integer');
	
		var terms = this.computeCoefficients(degree);
		var eqParts: string[] = [];
	
		eqParts.push(terms[0].toPrecision());
	
		for (var i = 1, len = terms.length; i < len; i++) {
			eqParts.push(terms[i] + ' * Math.pow(x, ' + i + ')');
		}
	
		var expr = 'return ' + eqParts.join(' + ') + ';';
	
		return new Function('x', expr);
	
	};
	
	/**
	 * Convert the polynomial to a string expression, mostly useful for visual debugging
	 * 
	 * @param {number} degree
	 * @returns {string}
	 */
	public toExpression(
		degree: number
	): string {
	
		if (isNaN(degree) || degree < 0) throw new Error('Degree must be a positive integer');
	
		var terms = this.computeCoefficients(degree);
		var eqParts: string[] = [];
		var len = terms.length;
	
		eqParts.push(terms[0].toPrecision());
	
		for (var i = 1; i < len; i++) {
			eqParts.push(terms[i] + 'x^' + i);
		}
	
		return eqParts.join(' + ');
	
	}

}
